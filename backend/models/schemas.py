from pydantic import BaseModel


class CVResponse(BaseModel):
    filename: str
    parsed_data: dict


class CVFixPayload(BaseModel):
    section: str
    fix: str
    why: str = ""
    how: str = ""


class GenerateFixRequest(BaseModel):
    cv_text: str
    fix: CVFixPayload
    output_format: str


class GenerateFixResponse(BaseModel):
    section: str
    format: str
    rewritten_text: str
    notes: str = ""


class CoverLetterJobPayload(BaseModel):
    title: str
    description: str = ""
    company_name: str = ""
    location: str = ""
    source: str = ""
    url: str = ""
    matched_skills: list[str] = []
    score: float | None = None


class GenerateCoverLetterRequest(BaseModel):
    cv_text: str
    job: CoverLetterJobPayload
    tone: str = "professional"


class GenerateCoverLetterResponse(BaseModel):
    job_title: str
    company_name: str = ""
    cover_letter: str
    notes: str = ""
