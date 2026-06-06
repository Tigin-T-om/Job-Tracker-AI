import io, os
import json
import google.generativeai as genai
from pypdf import PdfReader
from typing import Optional
from app.core.config import settings
from app.services.storage import storage_service

def extract_text_from_pdf(file_path: str, user_id: int) -> str:
    """
    Extracts plain text from a PDF file using pypdf from local disk or Google Drive.
    """
    if file_path.startswith("google_drive:"):
        file_bytes = storage_service.download_file(file_path, user_id)
        reader = PdfReader(io.BytesIO(file_bytes))
    else:
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"PDF file not found at path: {file_path}")
        reader = PdfReader(file_path)
        
    text = ""
    for page in reader.pages:
        extracted = page.extract_text()
        if extracted:
            text += extracted + "\n"
    return text.strip()


def analyze_resume_content(resume_text: str, job_description: Optional[str] = None) -> dict:
    """
    Sends the resume text (and optional job description) to Gemini 1.5 Flash 
    and returns a structured ATS analysis matching AIAnalysisResponse.
    """
    api_key = settings.gemini_api_key
    
    # Fallback mock analysis if Gemini API key is missing
    if not api_key:
        print("[AI Service] WARNING: gemini_api_key is not set in config. Returning mock analysis data.")
        
        has_jd = bool(job_description and len(job_description.strip()) > 10)
        return {
            "ats_score": 78,
            "job_match_percentage": 82 if has_jd else 0,
            "missing_keywords": ["FastAPI", "React Hooks", "Next.js App Router", "CI/CD Pipeline", "Docker"] if has_jd else ["Docker", "Kubernetes", "Redis", "Jest"],
            "skills_gap": [
                "TailwindCSS styling integrations",
                "Advanced container orchestration using Docker/Kubernetes"
            ] if has_jd else [
                "System architecture design",
                "Asynchronous backend message queues (Celery/Redis)"
            ],
            "improvements": [
                "Quantify your achievements (e.g., instead of 'built APIs', write 'built APIs that improved latency by 15%').",
                "Ensure your tech stack mentions Next.js and FastAPI clearly in your summary."
            ],
            "interview_prep": [
                "Explain the difference between Next.js Server Components and Client Components.",
                "How do you handle asynchronous background processing in FastAPI using background tasks or Celery?",
                "Tell me about a time you optimized a PostgreSQL database query. What was your approach?"
            ]
        }

    # Configure Gemini SDK
    genai.configure(api_key=api_key)
    
    model = genai.GenerativeModel("gemini-2.5-flash")
    
    prompt = f"""
    You are an expert ATS (Applicant Tracking System) parser and an elite tech recruiter.
    Analyze the candidate's resume text provided below.
    
    RESUME TEXT:
    {resume_text}
    """
    
    if job_description and len(job_description.strip()) > 10:
        prompt += f"""
        Compare the resume text specifically against this target Job Description:
        
        JOB DESCRIPTION:
        {job_description}
        
        Perform a thorough gap analysis and comparison.
        Your response MUST be a JSON object matching this schema:
        {{
            "ats_score": integer (0 to 100, representing general layout/parseability score),
            "job_match_percentage": integer (0 to 100, representing matching level of skills and experience),
            "missing_keywords": list of strings (keywords/technologies present in the Job Description but missing or weak in the resume),
            "skills_gap": list of strings (conceptual skills or experience gaps between resume and Job Description),
            "improvements": list of strings (actionable resume writing and formatting improvements to make it fit this role better),
            "interview_prep": list of strings (3 to 5 realistic mock technical/behavioral interview questions tailored to this role and candidate resume)
        }}
        """
    else:
        prompt += f"""
        Perform a general resume review.
        Your response MUST be a JSON object matching this schema:
        {{
            "ats_score": integer (0 to 100, representing general resume layout/parsing score),
            "job_match_percentage": 0 (since no job description was provided),
            "missing_keywords": list of strings (general high-demand keywords in modern web development missing in this resume),
            "skills_gap": list of strings (skills or tools the candidate should learn based on their current experience level),
            "improvements": list of strings (actionable resume formatting and experience section improvements),
            "interview_prep": list of strings (3 to 5 realistic general mock interview questions based on the candidate's background)
        }}
        """

    # Call Gemini requesting structured JSON
    response = model.generate_content(
        prompt,
        generation_config=genai.GenerationConfig(
            response_mime_type="application/json"
        )
    )
    
    try:
        analysis_dict = json.loads(response.text)
        # Ensure correct formatting types
        return {
            "ats_score": int(analysis_dict.get("ats_score", 60)),
            "job_match_percentage": int(analysis_dict.get("job_match_percentage", 0)),
            "missing_keywords": list(analysis_dict.get("missing_keywords", [])),
            "skills_gap": list(analysis_dict.get("skills_gap", [])),
            "improvements": list(analysis_dict.get("improvements", [])),
            "interview_prep": list(analysis_dict.get("interview_prep", []))
        }
    except Exception as e:
        print(f"[AI Service] Error parsing Gemini JSON: {e}. Raw text was: {response.text}")
        raise ValueError("Invalid JSON response from Gemini API.")

def generate_cover_letter_content(resume_text: str, job_description: str) -> str:
    """
    Sends the candidate's resume text and target job description to Gemini 2.5 Flash
    and returns a tailored, professionally formatted cover letter.
    """
    api_key = settings.gemini_api_key
    
    # Fallback mock cover letter if Gemini API key is missing
    if not api_key:
        print("[AI Service] WARNING: gemini_api_key is not set in config. Returning mock cover letter.")
        return """[Your Name]
[Your Address]
[Your Phone/Email]
[Date]
Hiring Team
[Company Name]
Subject: Application for Job Opportunity
Dear Hiring Manager,
I am writing to express my enthusiastic interest in the position described. With my background in software engineering and hands-on experience in building robust applications, I am confident in my ability to contribute value to your team.
Based on my resume, I have developed strong skills in modern web technologies and full-stack development. I am excited about the opportunity to apply these skills to solve the challenges outlined in your job description.
Thank you for your time and consideration. I look forward to the possibility of discussing how my experience aligns with your needs.
Sincerely,
[Your Name]"""
    # Configure Gemini SDK
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-2.5-flash")
    
    prompt = f"""
    You are an expert resume writer and career coach.
    Write a professional, highly tailored, and persuasive cover letter for a candidate applying to the job described below.
    Use the candidate's resume details to highlight relevant achievements, skills, and alignment with the role.
    Do not invent facts that are not present or implied in the resume, but present the existing skills and experience in the best possible light.
    The cover letter should be ready to send, formatted professionally, and include placeholders like [Company Name], [Your Name], etc. where appropriate if they are not clear from the resume.
    RESUME:
    {resume_text}
    JOB DESCRIPTION:
    {job_description}
    Output ONLY the cover letter text, with no extra conversational text or markdown wrappers like ```markdown.
    """
    
    response = model.generate_content(prompt)
    return response.text.strip()