from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # LLM
    openai_api_key: str
    anthropic_api_key: str = ""
    primary_llm: str = "openai"
    openai_chat_model: str = "gpt-4o-mini"
    openai_embedding_model: str = "text-embedding-3-small"
    anthropic_model: str = "claude-sonnet-4-6"

    # Database
    database_url: str

    # Storage
    upload_dir: str = "./uploads"
    faiss_index_dir: str = "./faiss_indexes"

    # App
    app_env: str = "development"
    max_upload_size_mb: int = 50
    chunk_size: int = 1000
    chunk_overlap: int = 200
    top_k_results: int = 5

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
