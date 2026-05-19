"""
GAZE — Global Awareness & Zero-trust Engine
Palantir Gotham-style multi-source OSINT fan-out.

Sources (all free / no-key-needed tier):
  GitHub API      — code search, repo search, user/org profile
  Shodan InternetDB — ports, vulns, tags (completely free, no key)
  AlienVault OTX  — threat pulses (no key for basic data)
  ip-api.com      — geolocation, ASN, proxy/tor/hosting flags
  URLScan.io      — URL/domain scan history + malicious verdicts
  NIST NVD        — CVE detail & keyword search
  CISA KEV        — known-exploited check
  RDAP            — domain registration data
  Google DoH      — multi-record-type DNS resolution
"""

import asyncio
import re
import os
from typing import Any

import httpx

# ── Entity type detection ─────────────────────────────────────────────────────

_IPv4_RE   = re.compile(r'^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$')
_CVE_RE    = re.compile(r'^CVE-\d{4}-\d+$', re.IGNORECASE)
_MD5_RE    = re.compile(r'^[0-9a-fA-F]{32}$')
_SHA1_RE   = re.compile(r'^[0-9a-fA-F]{40}$')
_SHA256_RE = re.compile(r'^[0-9a-fA-F]{64}$')
_DOMAIN_RE = re.compile(r'^(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$')
_REPO_RE   = re.compile(r'^[\w.\-]+/[\w.\-]+$')


def detect_entity_type(query: str) -> str:
    q = query.strip()
    if _IPv4_RE.match(q):
        return 'ip'
    if _CVE_RE.match(q):
        return 'cve'
    if _MD5_RE.match(q) or _SHA1_RE.match(q) or _SHA256_RE.match(q):
        return 'hash'
    if q.startswith('http://') or q.startswith('https://'):
        return 'url'
    if _DOMAIN_RE.match(q):
        return 'domain'
    if _REPO_RE.match(q) and '/' in q:
        return 'github_repo'
    if re.match(r'^[\w.\-]{1,39}$', q):
        return 'username_or_org'
    return 'keyword'


# ── Main fan-out ──────────────────────────────────────────────────────────────

async def hunt(query: str, github_token: str = '') -> dict:
    entity_type = detect_entity_type(query)
    token = github_token or os.getenv('GITHUB_TOKEN', '')

    async with httpx.AsyncClient(timeout=14.0, follow_redirects=True) as client:
        tasks: list[Any]   = []
        labels: list[str]  = []

        # GitHub search always runs
        tasks.append(_github_search(client, query, token))
        labels.append('github')

        if entity_type == 'ip':
            tasks += [_shodan_idb(client, query), _ip_api(client, query), _otx_ip(client, query)]
            labels += ['shodan', 'ipapi', 'otx']

        elif entity_type in ('domain', 'url'):
            domain = query.replace('https://', '').replace('http://', '').split('/')[0].split('?')[0]
            tasks += [_rdap_domain(client, domain), _dns_lookup(client, domain),
                      _urlscan(client, domain), _otx_domain(client, domain)]
            labels += ['rdap', 'dns', 'urlscan', 'otx']

        elif entity_type == 'cve':
            tasks += [_nvd_cve(client, query), _cisa_kev_check(client, query)]
            labels += ['nvd', 'cisa']

        elif entity_type == 'hash':
            tasks.append(_otx_hash(client, query))
            labels.append('otx')

        elif entity_type in ('github_repo', 'username_or_org'):
            name = query.split('/')[0]
            tasks.append(_github_profile(client, name, token))
            labels.append('github_profile')

        else:  # keyword
            tasks += [_nvd_keyword(client, query), _urlscan(client, query)]
            labels += ['nvd', 'urlscan']

        raw = await asyncio.gather(*tasks, return_exceptions=True)

    sources: dict = {}
    for label, res in zip(labels, raw):
        sources[label] = {'error': str(res)} if isinstance(res, Exception) else res

    return {
        'query':       query,
        'entity_type': entity_type,
        'risk_score':  _compute_risk(entity_type, sources),
        'sources':     sources,
    }


# ── GitHub ────────────────────────────────────────────────────────────────────

async def _github_search(client: httpx.AsyncClient, query: str, token: str) -> dict:
    hdrs = {'Accept': 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28'}
    if token:
        hdrs['Authorization'] = f'Bearer {token}'

    repo_resp, code_resp = await asyncio.gather(
        client.get(f'https://api.github.com/search/repositories?q={query}&per_page=5&sort=updated', headers=hdrs),
        client.get(f'https://api.github.com/search/code?q={query}&per_page=5', headers=hdrs),
        return_exceptions=True,
    )

    repos, code_hits, code_items, repo_total = [], 0, [], 0
    if not isinstance(repo_resp, Exception) and repo_resp.status_code == 200:
        d = repo_resp.json()
        repo_total = d.get('total_count', 0)
        for r in d.get('items', [])[:5]:
            repos.append({
                'full_name':   r['full_name'],
                'description': (r.get('description') or '')[:120],
                'stars':       r.get('stargazers_count', 0),
                'url':         r['html_url'],
                'language':    r.get('language'),
                'updated':     (r.get('updated_at') or '')[:10],
            })

    if not isinstance(code_resp, Exception) and code_resp.status_code == 200:
        d = code_resp.json()
        code_hits = d.get('total_count', 0)
        for item in d.get('items', [])[:3]:
            code_items.append({
                'name': item['name'],
                'repo': item['repository']['full_name'],
                'url':  item['html_url'],
                'path': item.get('path', ''),
            })

    rl = -1
    if not isinstance(repo_resp, Exception):
        rl = int(repo_resp.headers.get('X-RateLimit-Remaining', -1))

    return {
        'repo_total':    repo_total,
        'code_hits':     code_hits,
        'repos':         repos,
        'code_matches':  code_items,
        'rate_remaining': rl,
    }


async def _github_profile(client: httpx.AsyncClient, name: str, token: str) -> dict:
    hdrs = {'Accept': 'application/vnd.github+json'}
    if token:
        hdrs['Authorization'] = f'Bearer {token}'

    user_r, repo_r = await asyncio.gather(
        client.get(f'https://api.github.com/users/{name}', headers=hdrs),
        client.get(f'https://api.github.com/users/{name}/repos?sort=updated&per_page=6', headers=hdrs),
        return_exceptions=True,
    )
    profile: dict = {}
    if not isinstance(user_r, Exception) and user_r.status_code == 200:
        d = user_r.json()
        profile = {
            'login':        d.get('login'),
            'name':         d.get('name'),
            'type':         d.get('type'),
            'public_repos': d.get('public_repos', 0),
            'followers':    d.get('followers', 0),
            'created':      (d.get('created_at') or '')[:10],
            'bio':          d.get('bio'),
            'company':      d.get('company'),
            'location':     d.get('location'),
            'avatar':       d.get('avatar_url'),
        }

    repos: list = []
    if not isinstance(repo_r, Exception) and repo_r.status_code == 200:
        for r in repo_r.json()[:6]:
            repos.append({
                'name':        r['name'],
                'description': (r.get('description') or '')[:100],
                'stars':       r.get('stargazers_count', 0),
                'language':    r.get('language'),
                'url':         r['html_url'],
                'updated':     (r.get('updated_at') or '')[:10],
            })

    return {'profile': profile, 'repos': repos}


# ── Shodan InternetDB (fully free) ────────────────────────────────────────────

async def _shodan_idb(client: httpx.AsyncClient, ip: str) -> dict:
    r = await client.get(f'https://internetdb.shodan.io/{ip}')
    if r.status_code == 200:
        d = r.json()
        return {
            'ports':     d.get('ports', []),
            'hostnames': d.get('hostnames', []),
            'cpes':      d.get('cpes', []),
            'vulns':     d.get('vulns', []),
            'tags':      d.get('tags', []),
        }
    return {'ports': [], 'hostnames': [], 'cpes': [], 'vulns': [], 'tags': []}


# ── ip-api.com ────────────────────────────────────────────────────────────────

async def _ip_api(client: httpx.AsyncClient, ip: str) -> dict:
    r = await client.get(f'http://ip-api.com/json/{ip}?fields=66842623')
    if r.status_code == 200:
        d = r.json()
        return {
            'country': d.get('country'), 'country_code': d.get('countryCode'),
            'city':    d.get('city'),    'region': d.get('regionName'),
            'org':     d.get('org'),     'isp':    d.get('isp'),
            'as':      d.get('as'),
            'lat':     d.get('lat'),     'lon': d.get('lon'),
            'proxy':   d.get('proxy', False),
            'tor':     d.get('tor', False),
            'hosting': d.get('hosting', False),
            'mobile':  d.get('mobile', False),
        }
    return {}


# ── AlienVault OTX ────────────────────────────────────────────────────────────

async def _otx_ip(client: httpx.AsyncClient, ip: str) -> dict:
    r = await client.get(f'https://otx.alienvault.com/api/v1/indicators/IPv4/{ip}/general')
    return _parse_otx(r)

async def _otx_domain(client: httpx.AsyncClient, domain: str) -> dict:
    r = await client.get(f'https://otx.alienvault.com/api/v1/indicators/domain/{domain}/general')
    return _parse_otx(r)

async def _otx_hash(client: httpx.AsyncClient, h: str) -> dict:
    r = await client.get(f'https://otx.alienvault.com/api/v1/indicators/file/{h}/general')
    return _parse_otx(r)

def _parse_otx(r: httpx.Response) -> dict:
    if r.status_code != 200:
        return {'pulse_count': 0, 'tags': [], 'malware_families': [], 'reputation': 0}
    d = r.json()
    pi = d.get('pulse_info', {})
    pulses = pi.get('pulses', [])
    tags     = list(set(t for p in pulses for t in p.get('tags', [])))[:12]
    families = list(set(m.get('display_name', '') for p in pulses for m in p.get('malware_families', [])))[:6]
    return {
        'pulse_count':      pi.get('count', 0),
        'tags':             tags,
        'malware_families': [f for f in families if f],
        'reputation':       d.get('reputation', 0),
    }


# ── URLScan.io ────────────────────────────────────────────────────────────────

async def _urlscan(client: httpx.AsyncClient, query: str) -> dict:
    r = await client.get(
        f'https://urlscan.io/api/v1/search/?q={query}&size=5',
        headers={'Accept': 'application/json'},
    )
    if r.status_code == 200:
        d = r.json()
        hits = []
        for item in d.get('results', [])[:5]:
            page = item.get('page', {})
            verdicts = item.get('verdicts', {}).get('overall', {})
            hits.append({
                'url':       (page.get('url') or '')[:100],
                'domain':    page.get('domain'),
                'country':   page.get('country'),
                'ip':        page.get('ip'),
                'malicious': verdicts.get('malicious', False),
                'score':     verdicts.get('score', 0),
                'tags':      item.get('verdicts', {}).get('overall', {}).get('tags', []),
            })
        return {'total': d.get('total', 0), 'hits': hits}
    return {'total': 0, 'hits': []}


# ── NIST NVD ──────────────────────────────────────────────────────────────────

async def _nvd_cve(client: httpx.AsyncClient, cve_id: str) -> dict:
    r = await client.get(
        f'https://services.nvd.nist.gov/rest/json/cves/2.0?cveId={cve_id.upper()}',
    )
    if r.status_code == 200:
        vulns = r.json().get('vulnerabilities', [])
        if vulns:
            return _parse_nvd_vuln(vulns[0].get('cve', {}))
    return {}

async def _nvd_keyword(client: httpx.AsyncClient, keyword: str) -> dict:
    r = await client.get(
        f'https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch={keyword}&resultsPerPage=5',
    )
    if r.status_code == 200:
        d = r.json()
        return {
            'total': d.get('totalResults', 0),
            'cves':  [_parse_nvd_vuln(v.get('cve', {})) for v in d.get('vulnerabilities', [])[:5]],
        }
    return {'total': 0, 'cves': []}

def _parse_nvd_vuln(cve: dict) -> dict:
    metrics  = cve.get('metrics', {})
    cvss_v31 = (metrics.get('cvssMetricV31') or [{}])[0].get('cvssData', {})
    cvss_v30 = (metrics.get('cvssMetricV30') or [{}])[0].get('cvssData', {})
    cvss     = cvss_v31 or cvss_v30
    desc     = next((d.get('value', '') for d in cve.get('descriptions', []) if d.get('lang') == 'en'), '')
    return {
        'id':           cve.get('id'),
        'description':  desc[:300],
        'severity':     cvss.get('baseSeverity'),
        'base_score':   cvss.get('baseScore'),
        'vector':       cvss.get('vectorString'),
        'published':    (cve.get('published') or '')[:10],
        'last_modified':(cve.get('lastModified') or '')[:10],
        'references':   [r.get('url', '') for r in cve.get('references', [])[:3]],
        'weaknesses':   [(w.get('description') or [{}])[0].get('value', '') for w in cve.get('weaknesses', [])[:3]],
    }


# ── CISA KEV check ────────────────────────────────────────────────────────────

async def _cisa_kev_check(client: httpx.AsyncClient, cve_id: str) -> dict:
    r = await client.get(
        'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json',
        headers={'User-Agent': 'ARGUS-GAZE/1.0 (institutional-security)'},
    )
    if r.status_code == 200:
        for v in r.json().get('vulnerabilities', []):
            if v.get('cveID', '').upper() == cve_id.upper():
                return {
                    'in_kev':          True,
                    'date_added':      v.get('dateAdded'),
                    'due_date':        v.get('dueDate'),
                    'required_action': (v.get('requiredAction') or '')[:200],
                    'ransomware_use':  v.get('knownRansomwareCampaignUse', 'Unknown'),
                }
    return {'in_kev': False}


# ── RDAP ─────────────────────────────────────────────────────────────────────

async def _rdap_domain(client: httpx.AsyncClient, domain: str) -> dict:
    r = await client.get(f'https://rdap.org/domain/{domain}')
    if r.status_code == 200:
        d = r.json()
        events = [{'action': e.get('eventAction'), 'date': (e.get('eventDate') or '')[:10]}
                  for e in d.get('events', [])[:5]]
        nameservers = [ns.get('ldhName') for ns in d.get('nameservers', [])][:4]
        return {
            'name':        d.get('ldhName'),
            'status':      d.get('status', []),
            'events':      events,
            'nameservers': nameservers,
        }
    return {}


# ── DNS over HTTPS (Google) ───────────────────────────────────────────────────

async def _dns_lookup(client: httpx.AsyncClient, domain: str) -> dict:
    results: dict = {}
    for rtype in ('A', 'MX', 'NS', 'TXT'):
        try:
            r = await client.get(
                f'https://dns.google/resolve?name={domain}&type={rtype}',
                headers={'Accept': 'application/dns-json'},
            )
            if r.status_code == 200:
                answers = r.json().get('Answer', [])
                results[rtype] = [a.get('data', '') for a in answers][:4]
        except Exception:
            pass
    return results


# ── Risk scoring ──────────────────────────────────────────────────────────────

def _compute_risk(entity_type: str, sources: dict) -> int:
    score = 0

    if entity_type == 'ip':
        s = sources.get('shodan', {})
        score += len(s.get('vulns', [])) * 15
        score += min(len(s.get('ports', [])) * 2, 20)
        dangerous_tags = {'tor', 'vpn', 'scanner', 'malware', 'botnet', 'proxy'}
        if any(t.lower() in dangerous_tags for t in s.get('tags', [])):
            score += 40
        otx = sources.get('otx', {})
        score += min(otx.get('pulse_count', 0) * 5, 40)
        ip = sources.get('ipapi', {})
        if ip.get('tor'):     score += 30
        if ip.get('proxy'):   score += 15
        if ip.get('hosting'): score += 5

    elif entity_type in ('domain', 'url'):
        otx = sources.get('otx', {})
        score += min(otx.get('pulse_count', 0) * 8, 60)
        us = sources.get('urlscan', {})
        score += sum(20 for h in us.get('hits', []) if h.get('malicious'))

    elif entity_type == 'cve':
        nvd = sources.get('nvd', {})
        bs  = nvd.get('base_score')
        if bs:
            score += int(float(bs) * 8)
        if sources.get('cisa', {}).get('in_kev'):
            score += 30

    elif entity_type == 'hash':
        otx = sources.get('otx', {})
        score += min(otx.get('pulse_count', 0) * 12, 80)
        if otx.get('malware_families'):
            score += 25

    # GitHub code exposure adds risk for any entity type
    gh = sources.get('github', {})
    score += min(gh.get('code_hits', 0) * 2, 20)

    return min(score, 100)
