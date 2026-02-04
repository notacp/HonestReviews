from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any
from dotenv import load_dotenv
import os
import sys
import logging

# Ensure the api directory is in the path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

try:
    from .scraper import scrape_reddit
    from .analyzer import analyze_reviews
except ImportError:
    from scraper import scrape_reddit
    from analyzer import analyze_reviews

# Load environment variables
env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path=env_path)

app = FastAPI()

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Models ---
class AnalyzeRequest(BaseModel):
    product_name: str = Field(..., min_length=1, description="The name of the product to analyze")

class Source(BaseModel):
    title: str
    url: str
    subreddit: str
    score: int

class AnalysisData(BaseModel):
    conclusion: str
    pros: List[str]
    cons: List[str]
    sentiment_score: int
    word_cloud: List[Dict[str, Any]]

class AnalyzeResponse(BaseModel):
    product: str
    analysis: AnalysisData
    sources: List[Source]

@app.post("/api/analyze", response_model=AnalyzeResponse)
def analyze_product(request: AnalyzeRequest):
    """
    Orchestrates the scraping and AI analysis flow with dynamic subreddit discovery.
    """
    logger.info(f"Analysis requested for product: {request.product_name}")

    # 1. Scrape Reddit dynamically
    try:
        scrape_result = scrape_reddit(request.product_name)
    except Exception as e:
        logger.error(f"Scraper error: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve data from Reddit.")

    if "error" in scrape_result:
        raise HTTPException(status_code=400, detail=scrape_result["error"])

    # 2. Analyze with LLM
    try:
        analysis_result = analyze_reviews(scrape_result["text_blob"])
    except Exception as e:
        logger.error(f"Analysis error: {e}")
        raise HTTPException(status_code=500, detail="Failed to analyze reviews.")

    if "error" in analysis_result:
        raise HTTPException(status_code=500, detail=analysis_result["error"])

    # 3. Construct Response
    return AnalyzeResponse(
        product=request.product_name,
        analysis=AnalysisData(**analysis_result),
        sources=[Source(**src) for src in scrape_result.get("sources", [])]
    )
