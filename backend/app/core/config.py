"""
ARGUS — Core Configuration v6.1
AI Provider Priority: NVIDIA NIM (free) → Claude → GPT → Gemini → Grok → Perplexity → Ollama
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str    = "ARGUS — Palantir-Class Autonomous Cyber Defense Intelligence Platform"
    APP_VERSION: str = "6.1.0"

    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:3000",
    ]

    # ─────────────────────────────────────────────────────────────────────────
    # NVIDIA NIM  ·  FREE SHOWCASE TIER
    # ─────────────────────────────────────────────────────────────────────────
    # Sign up free: https://build.nvidia.com
    # Free tier: 1,000 API calls/month — enough for demos & showcasing
    # Models run on NVIDIA DGX Cloud — genuinely enterprise-grade inference
    NVIDIA_API_KEY: str        = ""
    NVIDIA_MODEL: str          = "nvidia/llama-3.3-nemotron-super-49b-v1"   # NVIDIA flagship 49B
    NVIDIA_MODEL_FAST: str     = "meta/llama-3.3-70b-instruct"              # 70B — fast fallback
    NVIDIA_MODEL_LARGE: str    = "meta/llama-3.1-405b-instruct"             # 405B — max capability

    # ─────────────────────────────────────────────────────────────────────────
    # ANTHROPIC CLAUDE  ·  BEST REASONING
    # ─────────────────────────────────────────────────────────────────────────
    # Get API key: https://console.anthropic.com
    # Claude Opus 4.7 = world's best at complex threat analysis & attack chain reasoning
    ANTHROPIC_API_KEY: str      = ""
    ANTHROPIC_MODEL: str        = "claude-opus-4-7"           # Most capable — elite reasoning
    ANTHROPIC_MODEL_FAST: str   = "claude-sonnet-4-6"         # Fast + powerful
    ANTHROPIC_MODEL_MINI: str   = "claude-haiku-4-5-20251001" # Ultra-fast for bulk tasks

    # ─────────────────────────────────────────────────────────────────────────
    # OPENAI GPT  ·  GOLD STANDARD
    # ─────────────────────────────────────────────────────────────────────────
    # Get API key: https://platform.openai.com
    OPENAI_API_KEY: str         = ""
    OPENAI_MODEL: str           = "gpt-4o"     # Best general-purpose
    OPENAI_MODEL_REASONING: str = "o4-mini"    # Best reasoning model (cost-efficient)
    OPENAI_MODEL_MINI: str      = "gpt-4o-mini"

    # ─────────────────────────────────────────────────────────────────────────
    # GOOGLE GEMINI  ·  MASSIVE CONTEXT + MULTIMODAL
    # ─────────────────────────────────────────────────────────────────────────
    # Get API key FREE: https://aistudio.google.com/app/apikey
    # Gemini 2.5 Pro has 1M token context — ideal for large log file analysis
    GEMINI_API_KEY: str         = ""
    GEMINI_MODEL: str           = "gemini-2.5-pro"   # Most capable — 1M context
    GEMINI_MODEL_FAST: str      = "gemini-2.0-flash"  # Ultra-fast, free tier generous

    # ─────────────────────────────────────────────────────────────────────────
    # XAI GROK  ·  REAL-TIME THREAT INTELLIGENCE
    # ─────────────────────────────────────────────────────────────────────────
    # Get API key: https://console.x.ai
    # Grok-3 has live X/internet access — great for emerging threat feeds
    XAI_API_KEY: str            = ""
    GROK_MODEL: str             = "grok-3"       # xAI's most powerful
    GROK_MODEL_FAST: str        = "grok-3-mini"  # Fast reasoning

    # ─────────────────────────────────────────────────────────────────────────
    # PERPLEXITY  ·  LIVE INTERNET THREAT INTELLIGENCE
    # ─────────────────────────────────────────────────────────────────────────
    # Get API key: https://www.perplexity.ai/settings/api
    # Sonar Pro searches the live web — real-time CVE, threat actor, and IOC lookups
    PERPLEXITY_API_KEY: str     = ""
    PERPLEXITY_MODEL: str       = "sonar-pro"   # Live web search — most capable
    PERPLEXITY_MODEL_FAST: str  = "sonar"       # Faster, still live web

    # ─────────────────────────────────────────────────────────────────────────
    # OLLAMA LOCAL  ·  FREE · PRIVATE · NO INTERNET REQUIRED
    # ─────────────────────────────────────────────────────────────────────────
    # Install: https://ollama.ai  →  ollama pull llama3.2
    OLLAMA_BASE_URL: str        = "http://localhost:11434"
    OLLAMA_MODEL: str           = "llama3.2"
    OLLAMA_MODEL_FALLBACK: str  = "mistral"
    OLLAMA_MODEL_LARGE: str     = "llama3.1:8b"

    # ─────────────────────────────────────────────────────────────────────────
    # FEATHERLESS  ·  LEGACY OPEN-SOURCE MODELS
    # ─────────────────────────────────────────────────────────────────────────
    FEATHERLESS_API_KEY: str        = ""
    FEATHERLESS_MODEL: str          = "Qwen/Qwen3.6-35B-A3B"
    FEATHERLESS_MODEL_FAST: str     = "meta-llama/Llama-3.1-8B-Instruct"
    FEATHERLESS_MODEL_FALLBACK: str = "meta-llama/Llama-3.1-8B-Instruct"

    # ─────────────────────────────────────────────────────────────────────────
    # THREAT INTELLIGENCE APIs  (all have free tiers)
    # ─────────────────────────────────────────────────────────────────────────
    ABUSEIPDB_API_KEY: str  = ""
    GREYNOISE_API_KEY: str  = ""
    NVD_API_KEY: str        = ""
    SHODAN_API_KEY: str     = ""
    VIRUSTOTAL_API_KEY: str = ""
    HIBP_API_KEY: str       = ""

    # ─────────────────────────────────────────────────────────────────────────
    # AUTH (not required for local demo)
    # ─────────────────────────────────────────────────────────────────────────
    AUTH0_DOMAIN: str    = "your-domain.auth0.com"
    AUTH0_AUDIENCE: str  = "https://argus-api"
    AUTH0_CLIENT_ID: str = "your-client-id"

    class Config:
        env_file          = ".env"
        env_file_encoding = "utf-8"
        extra             = "ignore"


settings = Settings()
