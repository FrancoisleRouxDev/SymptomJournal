content = '''from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime
from uuid import UUID

VALID_TIME_OF_DAY = ["morning", "afternoon", "evening", "night"]
VALID_TRIGGER_TYPES = ["sleep", "stress", "food", "exercise", "weather", "other"]


class SymptomLogCreate(BaseModel):
    description: str = Field(..., min_length=3, max_length=500)
    severity: Optional[int] = Field(None, ge=1, le=10)
    time_of_day: Optional[str] = Field(None)
    mood: Optional[str] = Field(None, max_length=100)

    @field_validator("time_of_day")
    @classmethod
    def validate_time_of_day(cls, v):
        if v is not None and v.lower() not in VALID_TIME_OF_DAY:
            raise ValueError(f"time_of_day must be one of: {VALID_TIME_OF_DAY}")
        return v.lower() if v else v

    @field_validator("description")
    @classmethod
    def validate_description(cls, v):
        if v.strip() == "":
            raise ValueError("Description cannot be empty")
        return v.strip()

    @field_validator("mood")
    @classmethod
    def validate_mood(cls, v):
        return v.strip() if v is not None else v


class SymptomLogResponse(BaseModel):
    id: UUID
    user_id: UUID
    description: str
    severity: Optional[int] = None
    time_of_day: Optional[str] = None
    mood: Optional[str] = None
    created_at: datetime


class TriggerCreate(BaseModel):
    trigger_type: str = Field(...)
    trigger_value: str = Field(..., min_length=1, max_length=200)

    @field_validator("trigger_type")
    @classmethod
    def validate_trigger_type(cls, v):
        if v.lower() not in VALID_TRIGGER_TYPES:
            raise ValueError(f"trigger_type must be one of: {VALID_TRIGGER_TYPES}")
        return v.lower()


class SymptomLogWithTriggers(SymptomLogCreate):
    triggers: Optional[list[TriggerCreate]] = []
'''

with open('models/symptom.py', 'w') as f:
    f.write(content)
print('Done')