import os
import sys

# Ensure the parent directory is in the Python path so we can import 'app'
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.db.database import SessionLocal
from app.models.user import User
from app.models.job import Job
from app.models.interview import Interview
from app.models.resume import Resume
from app.services.ai import extract_text_from_pdf, analyze_resume_content

def test_diagnostic():
    db = SessionLocal()
    try:
        # Fetch the resume with ID 1
        resume = db.query(Resume).filter(Resume.id == 1).first()
        if not resume:
            print("❌ ERROR: Resume with ID 1 was not found in the database.")
            print("Please upload a resume in the Profile section first before running this test.")
            return

        print(f"📊 Diagnostic Test for Resume ID 1")
        print(f"-----------------------------------")
        print(f"Name:      {resume.resume_name}")
        print(f"Filename:  {resume.filename}")
        print(f"Disk Path: {resume.file_path}")
        print(f"Exists:    {os.path.exists(resume.file_path)}")
        print(f"-----------------------------------\n")

        # Step 1: Text Extraction test
        print("🔍 Step 1: Extracting text from PDF...")
        try:
            text = extract_text_from_pdf(resume.file_path)
            print(f"✅ Success! Extracted {len(text)} characters.")
            print(f"Preview (first 150 chars):\n\"\"\"\n{text[:150]}...\n\"\"\"\n")
        except Exception as err:
            print("❌ FAILED during PDF text extraction:")
            raise err

        # Step 2: AI Gemini call test
        print("🤖 Step 2: Calling Gemini AI Analysis...")
        try:
            # We pass a simple job description to trigger match percentage comparison
            analysis = analyze_resume_content(text, "Looking for a Python Backend developer with FastAPI and React experience.")
            print("✅ Success! Gemini returned analysis successfully:")
            import pprint
            pprint.pprint(analysis)
        except Exception as err:
            print("❌ FAILED during Gemini API request/response parsing:")
            raise err

    except Exception as e:
        print("\n💥 DETAILED TRACEBACK OF THE ERROR:")
        print("====================================")
        import traceback
        traceback.print_exc()
        print("====================================")
    finally:
        db.close()

if __name__ == "__main__":
    test_diagnostic()
