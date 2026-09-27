from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID

class SymptomLogCreate(BaseModel):
    description: str
    severity: Optional[int] = None
    time_of_day: Optional[str] = None
    mood: Optional[str] = None

class SymptomLogResponse(BaseModel):
    id: UUID
    user_id: UUID
    description: str
    severity: Optional[int] = None
    time_of_day: Optional[str] = None
    mood: Optional[str] = None
    created_at: datetime

class TriggerCreate(BaseModel):
    trigger_type: str
    trigger_value: str

class SymptomLogWithTriggers(SymptomLogCreate):
    triggers: Optional[list[TriggerCreate]] = []