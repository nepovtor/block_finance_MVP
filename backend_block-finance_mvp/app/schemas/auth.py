from pydantic import BaseModel, Field


class AuthRegisterPayload(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    phone: str = Field(min_length=5, max_length=32)
    password: str = Field(min_length=8, max_length=128)
    personal_data_consent: bool = Field(default=False)
    consent_version: str = Field(default="2026-04-privacy-v1", max_length=64)


class AuthLoginPayload(BaseModel):
    phone: str = Field(min_length=5, max_length=32)
    password: str = Field(min_length=8, max_length=128)
