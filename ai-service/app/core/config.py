from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # OpenRouter (primary — free models)
    openrouter_api_key: str = ""
    openrouter_model: str = "meta-llama/llama-3.3-70b-instruct:free"
    openrouter_site_url: str = "http://localhost:5173"
    openrouter_site_name: str = "PrepGenius AI"

    # Groq (secondary — fast, free)
    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"

    # Gemini (tertiary)
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.0-flash"

    # Code Execution
    judge0_api_url: str = "https://judge0-ce.p.rapidapi.com"
    judge0_api_key: str = ""

    # DB
    mongodb_uri: str = "mongodb://localhost:27017/prepgenius"
    port: int = 8000


settings = Settings()
