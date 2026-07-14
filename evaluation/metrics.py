import os
import time
import json
import asyncio
from pathlib import Path
from deepeval.models.base_model import DeepEvalBaseLLM
from deepeval.metrics.base_metric import BaseMetric
from deepeval.metrics import FaithfulnessMetric, AnswerRelevancyMetric
from deepeval.test_case import LLMTestCase, LLMTestCaseParams
from openai import OpenAI, AsyncOpenAI

def load_groq_api_key():
    # 1. Check direct environment
    key = os.getenv("GROQ_API_KEY")
    if key:
        return key
        
    # 2. Check backend/.env
    backend_env = Path(__file__).resolve().parents[1] / "backend" / ".env"
    if backend_env.exists():
        for line in backend_env.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line.startswith("GROQ_API_KEY="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
                
    return None

class GroqLLM(DeepEvalBaseLLM):
    def __init__(self, model_name="meta-llama/llama-4-scout-17b-16e-instruct"):
        self.model_name = model_name
        api_key = load_groq_api_key()
        if not api_key:
            raise ValueError("GROQ_API_KEY not found in environment or backend/.env")
            
        self.client = OpenAI(
            api_key=api_key,
            base_url="https://api.groq.com/openai/v1"
        )
        self.async_client = AsyncOpenAI(
            api_key=api_key,
            base_url="https://api.groq.com/openai/v1"
        )

    def load_model(self):
        return self.model_name

    def generate(self, prompt: str) -> str:
        # Cap RPM to prevent rate limits
        time.sleep(4.0)
        kwargs = {}
        if "json" in prompt.lower():
            kwargs["response_format"] = {"type": "json_object"}
            
        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.0,
                max_tokens=4096,
                **kwargs
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"[Metrics LLM] Error with {self.model_name}: {e}. Retrying after sleep...")
            time.sleep(12.0)
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.0,
                max_tokens=4096,
                **kwargs
            )
            return response.choices[0].message.content

    async def a_generate(self, prompt: str) -> str:
        # Wait 4 seconds to prevent parallel bursts exceeding Groq TPM limits
        await asyncio.sleep(4.0)
        kwargs = {}
        if "json" in prompt.lower():
            kwargs["response_format"] = {"type": "json_object"}
            
        try:
            response = await self.async_client.chat.completions.create(
                model=self.model_name,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.0,
                max_tokens=4096,
                **kwargs
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"[Metrics LLM] Async error with {self.model_name}: {e}. Retrying after sleep...")
            await asyncio.sleep(12.0)
            response = await self.async_client.chat.completions.create(
                model=self.model_name,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.0,
                max_tokens=4096,
                **kwargs
            )
            return response.choices[0].message.content

    def get_model_name(self):
        return self.model_name


class CustomGEvalMetric(BaseMetric):
    def __init__(self, name, criteria, model, threshold=0.70):
        self.name = name
        self.criteria = criteria
        self.model = model
        self.threshold = threshold
        self.score = 0.0
        self.confidence = 1.0
        self.reason = ""
        self.strengths = []
        self.weaknesses = []
        self.deductions = []

    def is_successful(self) -> bool:
        return self.score >= self.threshold

    def _get_prompt(self, test_case: LLMTestCase) -> str:
        return f"""You are an expert AI QA evaluator for the CVClinic application.
Evaluate the following response based on the criteria and scoring rubrics below.

Evaluation Name: {self.name}

Evaluation Criteria & Rubric:
{self.criteria}

Test Case Details:
- Input Query: {test_case.input}
- Retrieval Context: {test_case.retrieval_context}
- Actual Output: {test_case.actual_output}

You must return a JSON object with the following fields:
{{
  "score": <float between 0.0 and 1.0 representing the final score>,
  "confidence": <float between 0.0 and 1.0 representing your confidence in this assessment>,
  "strengths": [<list of strings highlighting positive aspects of the response aligned with the rubric>],
  "weaknesses": [<list of strings highlighting specific flaws or missing details aligned with the rubric>],
  "deductions": [
    {{
      "criterion": "<the specific rubric rule violated>",
      "points": <negative float representing the score deduction, e.g., -0.1>
    }}
  ]
}}
Ensure the score matches 1.0 + sum(deductions), capped between 0.0 and 1.0. Do not output any other text or wrapping other than a single raw JSON object."""

    def _parse_response(self, raw_res: str):
        try:
            start_idx = raw_res.find('{')
            end_idx = raw_res.rfind('}') + 1
            if start_idx != -1 and end_idx != -1:
                json_str = raw_res[start_idx:end_idx]
            else:
                json_str = raw_res
                
            data = json.loads(json_str)
            self.score = max(0.0, min(1.0, float(data.get("score", 0.0))))
            self.confidence = max(0.0, min(1.0, float(data.get("confidence", 1.0))))
            self.strengths = data.get("strengths", [])
            self.weaknesses = data.get("weaknesses", [])
            self.deductions = data.get("deductions", [])
            
            # Recalculate score from deductions to enforce mathematical consistency!
            if self.deductions:
                computed_score = 1.0 + sum(float(d.get("points", 0.0)) for d in self.deductions)
                computed_score = round(max(0.0, min(1.0, computed_score)), 3)
                if abs(self.score - computed_score) > 0.01:
                    print(f"[{self.name}] Enforcing score consistency. LLM score: {self.score}, computed from deductions: {computed_score}")
                    self.score = computed_score
            
            # Format reason with score deduction details
            if self.weaknesses:
                deduction_details = []
                for d in self.deductions:
                    deduction_details.append(f"{d.get('criterion')} ({d.get('points')})")
                self.reason = "; ".join(self.weaknesses)
                if deduction_details:
                    self.reason += " [Deductions: " + ", ".join(deduction_details) + "]"
            else:
                self.reason = "Perfect score! All criteria satisfied."
        except Exception as e:
            print(f"[{self.name}] Error parsing LLM response: {e}. Raw response: {raw_res}")
            self.score = 0.0
            self.confidence = 0.0
            self.reason = f"Parsing error: {str(e)}"
            self.strengths = []
            self.weaknesses = ["Failed to parse LLM evaluation response."]
            self.deductions = []

    def measure(self, test_case: LLMTestCase) -> float:
        prompt = self._get_prompt(test_case)
        raw_res = self.model.generate(prompt)
        self._parse_response(raw_res)
        return self.score

    async def a_measure(self, test_case: LLMTestCase) -> float:
        prompt = self._get_prompt(test_case)
        raw_res = await self.model.a_generate(prompt)
        self._parse_response(raw_res)
        return self.score


def get_gemini_judge():
    return GroqLLM()

def get_faithfulness_metric(model):
    return FaithfulnessMetric(threshold=0.70, model=model)

def get_answer_relevancy_metric(model):
    return AnswerRelevancyMetric(threshold=0.70, model=model)

def get_career_quality_metric(model):
    criteria = """Evaluate whether the career recommendations are actionable, career-specific, and technically useful.
Use this explicit scoring rubric (each component is worth exactly 20% / 0.20 of the score):
- Base score starts at 1.0.
- Deduct -0.20 if recommendations fail to identify WHAT the recommendation is (definition/specification).
- Deduct -0.20 if recommendations fail to explain WHY it is recommended (rationale/justification).
- Deduct -0.20 if recommendations fail to explain HOW to implement it (concrete action steps).
- Deduct -0.20 if recommendations fail to describe the EXPECTED IMPACT (outcomes/benefits).
- Deduct -0.20 if recommendations fail to specify the ESTIMATED EFFORT (time/hours of study needed).
- Deduct -0.20 if the advice is generic and could reasonably apply to almost any software engineer.
- Ensure all deductions are listed in the 'deductions' field with negative values."""
    return CustomGEvalMetric(
        name="Career Recommendation Quality",
        criteria=criteria,
        model=model,
        threshold=0.70
    )

def get_project_quality_metric(model):
    criteria = """Evaluate the new project ideas and project improvements.
Use this scoring rubric:
- Base score starts at 1.0.
- Verify the following 6 criteria:
  1. Realistic: Is the project feasible and well-scoped? (Deduct -0.15 if not)
  2. Buildable in 1-3 weeks: Can it be completed in a reasonable timeframe? (Deduct -0.15 if not)
  3. Uses industry tools: Does it mention modern tools/libraries appropriate for the role? (Deduct -0.15 if not)
  4. Addresses missing skills: Does it target the candidate's skill gaps? (Deduct -0.20 if not)
  5. Independent project: Is it a standalone project rather than a minor tweak? (Deduct -0.15 if not)
  6. Portfolio worthy: Does it make a compelling addition to a resume? (Deduct -0.20 if not)
- Ensure all deductions are listed in the 'deductions' field with negative values."""
    return CustomGEvalMetric(
        name="Project Recommendation Quality",
        criteria=criteria,
        model=model,
        threshold=0.70
    )

def get_business_compliance_metric(model):
    criteria = """Verify strict compliance with the application's URL and study hours rules.
Use this scoring rubric (do NOT evaluate counts of skills/actions, Python does that):
- Base score starts at 1.0.
- Deduct -0.20 if any official learning URLs are completely missing, placeholder (e.g. '[placeholder]', 'example.com', 'temp.org'), or not provided. Do NOT penalize real official documentation URLs like docs.docker.com, postgresql.org, fastapi.tiangolo.com, or testdriven.io.
- Deduct -0.20 if estimated study hours are completely missing, placeholder, or not provided.
- Ensure all deductions are listed in the 'deductions' field with negative values."""
    return CustomGEvalMetric(
        name="Business Rule Compliance",
        criteria=criteria,
        model=model,
        threshold=0.70
    )

def get_personalization_metric(model):
    criteria = """Evaluate how well the advice is personalized to the candidate's profile.
Use this scoring rubric (each component is worth exactly 25% / 0.25 of the score):
- Base score starts at 1.0.
- Deduct -0.25 if recommendations do NOT reference the candidate's specific projects from their CV.
- Deduct -0.25 if recommendations do NOT reference the candidate's specific missing skills from their CV.
- Deduct -0.25 if recommendations do NOT reference the candidate's career goals/direction from their CV.
- Deduct -0.25 if the advice is generic and could reasonably apply to almost any software engineer without their specific background.
- Ensure all deductions are listed in the 'deductions' field with negative values."""
    return CustomGEvalMetric(
        name="Resume Personalization",
        criteria=criteria,
        model=model,
        threshold=0.70
    )
