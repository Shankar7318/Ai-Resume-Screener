import ollama
import json
import re
from typing import Dict, Any

def clean_json_response(response: str) -> str:
    """Extract JSON from model response"""
    # Find JSON object in response
    json_match = re.search(r'\{.*\}', response, re.DOTALL)
    if json_match:
        return json_match.group()
    return response

def build_prompt(resume_text: str, job_description: str) -> str:
    """Build prompt for Mistral model"""
    
    prompt = f"""You are an expert AI HR recruiter. Analyze this candidate resume against the job description.

JOB DESCRIPTION:
{job_description}

RESUME:
{resume_text}

Analyze and return ONLY a valid JSON object with this exact structure:
{{
    "name": "Full name of candidate",
    "email": "Email address",
    "phone": "Phone number if found",
    "skills": ["skill1", "skill2", "skill3"],
    "experience_years": 0.0,
    "skills_score": 0,
    "experience_score": 0,
    "education_score": 0,
    "overall_score": 0,
    "recommendation": "SELECT or REJECT",
    "reason": "Brief explanation for recommendation"
}}

Scoring guidelines:
- Skills score (0-100): Match between resume skills and job requirements
- Experience score (0-100): Relevance and years of experience
- Education score (0-100): Education level and relevance
- Overall score (0-100): Weighted average (skills 40%, experience 30%, education 30%)
- Recommend SELECT if overall score >= 70

Return ONLY the JSON object, no other text."""
    
    return prompt

def screen_resume(resume_text: str, job_description: str) -> Dict[str, Any]:
    """Screen resume using Mistral model"""
    
    try:
        prompt = build_prompt(resume_text, job_description)
        
        # Call Ollama
        response = ollama.chat(
            model="mistral:latest",
            messages=[
                {
                    "role": "system", 
                    "content": "You are an AI that responds only with valid JSON."
                },
                {
                    "role": "user", 
                    "content": prompt
                }
            ],
            options={
                "temperature": 0.1,  # Lower temperature for consistent output
                "top_p": 0.9
            }
        )
        
        # Extract and parse JSON
        result_text = response['message']['content']
        cleaned_text = clean_json_response(result_text)
        
        try:
            result = json.loads(cleaned_text)
        except json.JSONDecodeError:
            # If JSON parsing fails, return error with raw response
            return {
                "error": "Failed to parse model response",
                "raw_response": result_text[:500]
            }
        
        # Ensure all required fields exist
        required_fields = ["name", "email", "skills", "experience_years", 
                          "skills_score", "experience_score", "education_score", 
                          "overall_score", "recommendation", "reason"]
        
        for field in required_fields:
            if field not in result:
                if field in ["skills"]:
                    result[field] = []
                elif field in ["experience_years"]:
                    result[field] = 0.0
                elif field in ["skills_score", "experience_score", "education_score", "overall_score"]:
                    result[field] = 0
                else:
                    result[field] = ""
        
        return result
        
    except Exception as e:
        return {
            "error": str(e),
            "name": "",
            "email": "",
            "skills": [],
            "experience_years": 0,
            "skills_score": 0,
            "experience_score": 0,
            "education_score": 0,
            "overall_score": 0,
            "recommendation": "ERROR",
            "reason": f"Processing error: {str(e)}"
        }