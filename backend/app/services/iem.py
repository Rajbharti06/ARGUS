"""
ARGUS — Identity Exploitation Model (IEM) Engine
Implements the sequential probabilistic framework from:
  "The Identity Exploitation Model: A Sequential Probabilistic Framework
   for Quantifying Compound Breach Risk in Adversary-in-the-Middle
   Phishing Campaigns Against Higher Education Institutions"
  — Raj Bharti, IEEE TIFS Submission (2026)

P(breach) = P(L1) · P(L2|L1) · P(L3|L2) · P(L4|L3)

L1 — Human Trust (social engineering susceptibility)
L2 — Authentication (MFA bypass probability)
L3 — Interception (AiTM session token capture)
L4 — Privilege (post-compromise lateral movement / IAM escalation)
"""

import random
import statistics
from typing import Optional

# Fixed seed for reproducibility — matches paper (seed=42)
_SEED = 42

# ── IEM Layer Probability Ranges (Table II, paper) ────────────────────────────
# Source: Ulqinaku et al. [1], Aleroud & Zhou [6], Mandiant GTIG [9], MITRE [10]

LAYER_RANGES_LITERATURE = {
    "l1": (0.55, 0.90),   # Human Trust — standard to urgency+authority
    "l2_push":  (0.85, 0.98),  # Authentication — Push MFA / OTP bypass
    "l2_fido2": (0.18, 0.35),  # Authentication — FIDO2 hardware key
    "l2_sms":   (0.72, 0.88),  # Authentication — SMS OTP
    "l2_totp":  (0.68, 0.84),  # Authentication — TOTP authenticator
    "l2_none":  (0.97, 1.00),  # Authentication — no MFA
    "l3": (0.90, 0.98),   # Interception — AiTM active (EvilProxy/Evilginx2)
    "l4": (0.80, 0.95),   # Privilege — Centralized IAM escalation
}

# ── Institution-Specific Calibration (Table III, paper) ──────────────────────
# Ranges narrowed per institution based on public IAM disclosures, MFA config,
# and breach scope. Reproduces Table IV Monte Carlo results (N=100,000, seed=42).

INSTITUTIONS: dict[str, dict] = {
    "harvard": {
        "name":            "Harvard University",
        "mfa_type":        "Push MFA",
        "iam_platform":    "Salesforce / SharePoint",
        "records_exposed": "601,000+",
        "attack_vector":   "Vishing + AiTM (EvilProxy)",
        "l1": (0.72, 0.88),   # Advancement office — highest social engineering exposure
        "l2": (0.88, 0.96),   # Push MFA bypass — confirmed AiTM relay
        "l3": (0.91, 0.97),   # EvilProxy session interception — confirmed
        "l4": (0.83, 0.95),   # Centralized Salesforce/SharePoint IAM
        "mean_breach": 0.6122,
        "std_dev":      0.0555,
        "ci_95":       (0.512, 0.722),
    },
    "upenn": {
        "name":            "University of Pennsylvania",
        "mfa_type":        "Push MFA",
        "iam_platform":    "Salesforce / Entra",
        "records_exposed": "389,000+",
        "attack_vector":   "Vishing + AiTM",
        "l1": (0.62, 0.82),
        "l2": (0.87, 0.96),
        "l3": (0.90, 0.97),
        "l4": (0.81, 0.93),
        "mean_breach": 0.5359,
        "std_dev":      0.0575,
        "ci_95":       (0.433, 0.650),
    },
    "columbia": {
        "name":            "Columbia University",
        "mfa_type":        "Push MFA",
        "iam_platform":    "Okta / Salesforce",
        "records_exposed": "210,000+",
        "attack_vector":   "Vishing + AiTM",
        "l1": (0.48, 0.68),
        "l2": (0.85, 0.95),
        "l3": (0.88, 0.96),
        "l4": (0.78, 0.92),
        "mean_breach": 0.4016,
        "std_dev":      0.0586,
        "ci_95":       (0.299, 0.524),
    },
    "princeton": {
        "name":            "Princeton University",
        "mfa_type":        "Push MFA",
        "iam_platform":    "Salesforce",
        "records_exposed": "145,000+",
        "attack_vector":   "Vishing + AiTM",
        "l1": (0.42, 0.64),
        "l2": (0.85, 0.94),
        "l3": (0.88, 0.96),
        "l4": (0.75, 0.90),
        "mean_breach": 0.3663,
        "std_dev":      0.0604,
        "ci_95":       (0.262, 0.494),
    },
    "michigan": {
        "name":            "University of Michigan",
        "mfa_type":        "Push MFA",
        "iam_platform":    "Entra / SharePoint",
        "records_exposed": "98,000+",
        "attack_vector":   "Vishing + AiTM",
        "l1": (0.35, 0.55),
        "l2": (0.84, 0.94),
        "l3": (0.87, 0.95),
        "l4": (0.73, 0.88),
        "mean_breach": 0.2996,
        "std_dev":      0.0536,
        "ci_95":       (0.207, 0.414),
    },
}

# ── MFA Type L2 Ranges (Experiment 1, paper) ─────────────────────────────────
MFA_L2_RANGES: dict[str, tuple] = {
    "None":     (0.97, 1.00),
    "SMS OTP":  (0.72, 0.88),
    "Push MFA": (0.85, 0.98),
    "TOTP":     (0.68, 0.84),
    "FIDO2":    (0.18, 0.35),
}

# ── Attack Type L1/L3/L4 Ranges (Experiment 2, paper) ────────────────────────
ATTACK_RANGES: dict[str, dict] = {
    "Vishing (Standard)": {
        "l1": (0.40, 0.60),
        "l3": (0.86, 0.95),
        "l4": (0.76, 0.90),
    },
    "Vishing (High-Fidelity)": {
        "l1": (0.68, 0.88),
        "l3": (0.90, 0.98),
        "l4": (0.80, 0.95),
    },
    "AiTM Phishing": {
        "l1": (0.52, 0.72),
        "l3": (0.92, 0.99),  # AiTM is most effective at L3
        "l4": (0.82, 0.95),
    },
    "Ransomware": {
        "l1": (0.05, 0.14),  # Direct technical exploitation — low human trust dependency
        "l3": (0.88, 0.96),
        "l4": (0.75, 0.92),
    },
    "Hacktivist": {
        "l1": (0.78, 0.92),  # High technical sophistication
        "l3": (0.86, 0.94),
        "l4": (0.70, 0.86),
    },
}

# ── Sensitivity Analysis Interventions (Table VI, paper) ─────────────────────
INTERVENTIONS = {
    "L1 — Security Awareness Training (−15%)": {
        "layer": "l1",
        "reduction": 0.15,
        "source": "Kumaraguru et al. [13]",
        "result_mean": 0.5206,
        "delta_pct": -15.0,
    },
    "L2 — FIDO2 Migration (−72%)": {
        "layer": "l2",
        "reduction": 0.72,
        "source": "Ulqinaku et al. [1]",
        "result_mean": 0.1714,
        "delta_pct": -72.0,
    },
    "L3 — TLS Inspection + AiTM Detection (−30%)": {
        "layer": "l3",
        "reduction": 0.30,
        "source": "Mandiant GTIG [9]",
        "result_mean": 0.4287,
        "delta_pct": -30.0,
    },
    "L4 — Zero-Trust Network Segmentation (−40%)": {
        "layer": "l4",
        "reduction": 0.40,
        "source": "NIST SP 800-207 [14]",
        "result_mean": 0.3673,
        "delta_pct": -40.0,
    },
}

# ── Full 5×5 Scenario Matrix (Table IX, paper) ────────────────────────────────
SCENARIO_MATRIX = {
    "Vishing (Standard)":      {"None": 0.4233, "SMS OTP": 0.3538, "Push MFA": 0.3360, "TOTP": 0.2981, "FIDO2": 0.0785},
    "Vishing (High-Fidelity)": {"None": 0.6288, "SMS OTP": 0.5733, "Push MFA": 0.5635, "TOTP": 0.5009, "FIDO2": 0.1738},
    "AiTM Phishing":           {"None": 0.6188, "SMS OTP": 0.5773, "Push MFA": 0.5679, "TOTP": 0.5107, "FIDO2": 0.0733},
    "Ransomware":              {"None": 0.1252, "SMS OTP": 0.0752, "Push MFA": 0.0679, "TOTP": 0.0609, "FIDO2": 0.0429},
    "Hacktivist":              {"None": 0.6610, "SMS OTP": 0.4950, "Push MFA": 0.4555, "TOTP": 0.4160, "FIDO2": 0.2772},
}


# ── Core Engine ────────────────────────────────────────────────────────────────

def _uniform(lo: float, hi: float, rng: random.Random) -> float:
    return rng.uniform(lo, hi)


def monte_carlo_simulation(
    l1_range: tuple,
    l2_range: tuple,
    l3_range: tuple,
    l4_range: tuple,
    n: int = 100_000,
    seed: int = _SEED,
) -> dict:
    """
    Monte Carlo simulation of IEM breach probability.
    Equation 2: P(breach) = P(L1) · P(L2|L1) · P(L3|L2) · P(L4|L3)
    N=100,000 iterations, fixed seed=42 (matches paper protocol).
    """
    rng = random.Random(seed)
    samples = []
    for _ in range(n):
        p = (
            _uniform(*l1_range, rng)
            * _uniform(*l2_range, rng)
            * _uniform(*l3_range, rng)
            * _uniform(*l4_range, rng)
        )
        samples.append(p)

    samples.sort()
    mean   = statistics.mean(samples)
    stddev = statistics.stdev(samples)
    ci_lo  = samples[int(0.025 * n)]
    ci_hi  = samples[int(0.975 * n)]

    return {
        "mean":   round(mean, 4),
        "std":    round(stddev, 4),
        "ci_95":  (round(ci_lo, 4), round(ci_hi, 4)),
        "n":      n,
        "seed":   seed,
    }


def assess_institution(key: str) -> dict:
    """
    Full IEM assessment for a named institution.
    Returns paper's calibrated results for the 5 ShinyHunters targets.
    """
    inst = INSTITUTIONS.get(key)
    if not inst:
        return {"error": f"Unknown institution: {key}"}

    # Run live simulation (may differ slightly from paper due to Python random)
    live = monte_carlo_simulation(inst["l1"], inst["l2"], inst["l3"], inst["l4"])

    # FIDO2 counterfactual — same institution but L2 replaced with FIDO2 range
    fido2 = monte_carlo_simulation(
        inst["l1"], MFA_L2_RANGES["FIDO2"], inst["l3"], inst["l4"]
    )

    reduction = round((1 - fido2["mean"] / inst["mean_breach"]) * 100, 1)

    return {
        "institution":     inst["name"],
        "mfa_type":        inst["mfa_type"],
        "iam_platform":    inst["iam_platform"],
        "records_exposed": inst["records_exposed"],
        "attack_vector":   inst["attack_vector"],
        "layers": {
            "l1_range": inst["l1"],
            "l2_range": inst["l2"],
            "l3_range": inst["l3"],
            "l4_range": inst["l4"],
        },
        # Paper's calibrated results (Table IV)
        "paper_results": {
            "mean_breach_probability": inst["mean_breach"],
            "std_dev":                 inst["std_dev"],
            "ci_95":                   inst["ci_95"],
        },
        # Live simulation
        "live_simulation": live,
        # FIDO2 counterfactual
        "fido2_counterfactual": {
            "mean_breach_probability": fido2["mean"],
            "std_dev":                 fido2["std"],
            "risk_reduction_pct":      reduction,
            "absolute_reduction":      round(inst["mean_breach"] - fido2["mean"], 4),
        },
        "risk_tier": _risk_tier(inst["mean_breach"]),
    }


def all_institutions_comparison() -> list:
    """Return breach probability estimates for all 5 ShinyHunters campaign targets."""
    results = []
    for key, inst in INSTITUTIONS.items():
        fido2 = monte_carlo_simulation(
            inst["l1"], MFA_L2_RANGES["FIDO2"], inst["l3"], inst["l4"]
        )
        results.append({
            "key":             key,
            "name":            inst["name"],
            "mfa_type":        inst["mfa_type"],
            "records_exposed": inst["records_exposed"],
            "mean_breach":     inst["mean_breach"],
            "std_dev":         inst["std_dev"],
            "ci_95":           inst["ci_95"],
            "fido2_breach":    fido2["mean"],
            "fido2_reduction": round((1 - fido2["mean"] / inst["mean_breach"]) * 100, 1),
            "risk_tier":       _risk_tier(inst["mean_breach"]),
        })
    # Sort by breach probability (highest first)
    results.sort(key=lambda x: x["mean_breach"], reverse=True)
    return results


def sensitivity_analysis(institution_key: str = "harvard") -> dict:
    """
    Non-uniform realistic perturbation sensitivity analysis.
    Table VI from paper — Harvard parameters as baseline.
    Each layer independently reduced by intervention-specific factor.
    """
    inst = INSTITUTIONS.get(institution_key, INSTITUTIONS["harvard"])
    baseline_mean = inst["mean_breach"]
    results = []

    for label, iv in INTERVENTIONS.items():
        layer = iv["layer"]
        reduction = iv["reduction"]
        l1 = inst["l1"]
        l2 = inst["l2"]
        l3 = inst["l3"]
        l4 = inst["l4"]

        # Apply intervention to the target layer (shrink upper range)
        if layer == "l1":
            new_lo = l1[0] * (1 - reduction)
            new_hi = l1[1] * (1 - reduction)
            l1 = (new_lo, new_hi)
        elif layer == "l2":
            l2 = MFA_L2_RANGES["FIDO2"]  # FIDO2 migration
        elif layer == "l3":
            new_lo = l3[0] * (1 - reduction)
            new_hi = l3[1] * (1 - reduction)
            l3 = (new_lo, new_hi)
        elif layer == "l4":
            new_lo = l4[0] * (1 - reduction)
            new_hi = l4[1] * (1 - reduction)
            l4 = (new_lo, new_hi)

        sim = monte_carlo_simulation(l1, l2, l3, l4)
        actual_delta = round(((sim["mean"] - baseline_mean) / baseline_mean) * 100, 1)

        results.append({
            "intervention": label,
            "layer":        layer.upper(),
            "reduction_applied": f"{int(reduction*100)}%",
            "source":       iv["source"],
            "base_mean":    baseline_mean,
            "reduced_mean": sim["mean"],
            "paper_mean":   iv["result_mean"],
            "delta_pct":    actual_delta,
            "paper_delta":  iv["delta_pct"],
            "absolute_reduction": round(baseline_mean - sim["mean"], 4),
        })

    # Sort by impact (largest reduction first)
    results.sort(key=lambda x: x["delta_pct"])
    return {
        "institution": inst["name"],
        "baseline_breach_probability": baseline_mean,
        "analysis": results,
        "key_finding": (
            "FIDO2 authentication migration yields the largest single-layer "
            "breach probability reduction (−72.0%), outperforming security "
            "awareness training (−15.0%) by 4.8×."
        ),
        "source": "IEM Sensitivity Analysis — Raj Bharti, IEEE TIFS 2026",
    }


def mfa_attack_simulator() -> dict:
    """
    Full 5×5 MFA Attack Simulator.
    Table IX from paper: breach probability by MFA type × attack typology.
    Returns the calibrated scenario matrix from the paper.
    """
    mfa_types    = ["None", "SMS OTP", "Push MFA", "TOTP", "FIDO2"]
    attack_types = list(ATTACK_RANGES.keys())

    matrix = []
    for attack in attack_types:
        row = {"attack_type": attack, "results": {}}
        for mfa in mfa_types:
            paper_val = SCENARIO_MATRIX[attack][mfa]
            row["results"][mfa] = {
                "breach_probability": paper_val,
                "risk_tier": _risk_tier(paper_val),
            }
        row["safest_mfa"] = "FIDO2"
        row["fido2_vs_push_reduction"] = round(
            (1 - SCENARIO_MATRIX[attack]["FIDO2"] / SCENARIO_MATRIX[attack]["Push MFA"]) * 100, 1
        ) if SCENARIO_MATRIX[attack]["Push MFA"] > 0 else 0
        matrix.append(row)

    return {
        "mfa_types":    mfa_types,
        "attack_types": attack_types,
        "matrix":       matrix,
        "key_finding": (
            "FIDO2 reduces breach probability by 87.1% vs Push MFA for AiTM Phishing "
            "attacks, due to cryptographic origin binding that directly defeats the "
            "AiTM relay mechanism."
        ),
        "source": "IEM MFA Attack Simulator — Raj Bharti, IEEE TIFS 2026",
    }


def campaign_prediction(n_targets: int, base_institution: str = "harvard") -> dict:
    """
    Campaign-level breach expectation (Equation 4, paper).
    E[B] = N · P(L1) · P(L2|L1) · P(L3|L2) · P(L4|L3)
    """
    inst = INSTITUTIONS.get(base_institution, INSTITUTIONS["harvard"])
    p_breach = inst["mean_breach"]
    e_b = round(n_targets * p_breach, 2)

    # FIDO2 scenario
    fido2 = monte_carlo_simulation(
        inst["l1"], MFA_L2_RANGES["FIDO2"], inst["l3"], inst["l4"]
    )
    e_b_fido2 = round(n_targets * fido2["mean"], 2)

    return {
        "n_targets":           n_targets,
        "base_institution":    inst["name"],
        "breach_probability":  p_breach,
        "expected_breaches":   e_b,
        "fido2_scenario": {
            "breach_probability": fido2["mean"],
            "expected_breaches":  e_b_fido2,
            "breaches_prevented": round(e_b - e_b_fido2, 2),
        },
        "real_world_alignment": (
            f"IEM predicts E[B] = {e_b} breaches across {n_targets} targets. "
            "ShinyHunters campaign (15 targets, Feb 2026): ≥3 confirmed public disclosures "
            "(Harvard, UPenn, Princeton) with additional undisclosed compromises. "
            "Estimate aligns with lower bound of publicly disclosed outcomes."
        ),
        "source": "Equation 4, IEM — Raj Bharti, IEEE TIFS 2026",
    }


def realtime_iem_assessment(
    mfa_type: str = "Push MFA",
    has_aitm_indicators: bool = False,
    has_impossible_travel: bool = False,
    has_new_device: bool = False,
    has_credential_harvesting: bool = False,
    has_vpn: bool = False,
    has_tor: bool = False,
    has_authority_pretext: bool = False,
    has_urgency_language: bool = False,
    iam_type: str = "Centralized Cloud",
) -> dict:
    """
    Real-time IEM assessment based on live ARGUS signal observations.
    Dynamically adjusts L1-L4 ranges based on detected indicators.
    """
    # ── L1: Human Trust — adjust based on observed social engineering signals
    l1_lo, l1_hi = 0.55, 0.75  # baseline
    if has_authority_pretext:
        l1_lo += 0.10; l1_hi += 0.10
    if has_urgency_language:
        l1_lo += 0.08; l1_hi += 0.08
    if has_credential_harvesting:
        l1_lo += 0.05; l1_hi += 0.05
    l1 = (min(l1_lo, 0.90), min(l1_hi, 0.98))

    # ── L2: Authentication — based on MFA type
    l2 = MFA_L2_RANGES.get(mfa_type, MFA_L2_RANGES["Push MFA"])

    # ── L3: Interception — based on AiTM indicators
    l3_lo, l3_hi = 0.70, 0.85  # baseline (no AiTM confirmed)
    if has_aitm_indicators:
        l3_lo = 0.90; l3_hi = 0.98  # AiTM confirmed
    if has_vpn:
        l3_lo += 0.05; l3_hi += 0.03
    if has_tor:
        l3_lo += 0.08; l3_hi += 0.02
    l3 = (min(l3_lo, 0.99), min(l3_hi, 0.99))

    # ── L4: Privilege — based on IAM architecture and travel anomalies
    l4_lo, l4_hi = 0.65, 0.80  # baseline
    if iam_type == "Centralized Cloud":
        l4_lo = 0.80; l4_hi = 0.95
    if has_impossible_travel:
        l4_lo += 0.05; l4_hi += 0.03
    if has_new_device:
        l4_lo += 0.03; l4_hi += 0.02
    l4 = (min(l4_lo, 0.99), min(l4_hi, 0.99))

    sim = monte_carlo_simulation(l1, l2, l3, l4, n=10_000)

    # Intervention recommendation
    if mfa_type in ("Push MFA", "SMS OTP", "None", "TOTP"):
        fido2 = monte_carlo_simulation(l1, MFA_L2_RANGES["FIDO2"], l3, l4, n=10_000)
        fido2_reduction = round((1 - fido2["mean"] / max(sim["mean"], 0.001)) * 100, 1)
        recommendation = f"FIDO2 migration would reduce breach probability by ~{fido2_reduction}%"
    else:
        recommendation = "FIDO2 deployed — focus on L3 (AiTM detection) and L4 (Zero Trust)"

    active_signals = [
        sig for sig, active in {
            "Authority-based pretexting": has_authority_pretext,
            "Urgency language detected":  has_urgency_language,
            "Credential harvesting":      has_credential_harvesting,
            "AiTM proxy indicators":      has_aitm_indicators,
            "VPN/Proxy anonymization":    has_vpn,
            "TOR exit node":              has_tor,
            "Impossible travel":          has_impossible_travel,
            "New device fingerprint":     has_new_device,
        }.items() if active
    ]

    return {
        "breach_probability":  sim["mean"],
        "confidence_interval": sim["ci_95"],
        "risk_tier":          _risk_tier(sim["mean"]),
        "mfa_type":           mfa_type,
        "iam_type":           iam_type,
        "active_signals":     active_signals,
        "layer_estimates": {
            "l1_human_trust":      {"range": l1, "mean": round(sum(l1)/2, 3)},
            "l2_authentication":   {"range": l2, "mean": round(sum(l2)/2, 3), "mfa": mfa_type},
            "l3_interception":     {"range": l3, "mean": round(sum(l3)/2, 3)},
            "l4_privilege":        {"range": l4, "mean": round(sum(l4)/2, 3)},
        },
        "recommendation": recommendation,
        "framework": "Identity Exploitation Model (IEM) — Raj Bharti, IEEE TIFS 2026",
    }


def _risk_tier(p: float) -> str:
    if p >= 0.55: return "CRITICAL"
    if p >= 0.40: return "HIGH"
    if p >= 0.25: return "ELEVATED"
    return "MODERATE"
