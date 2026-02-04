import os
import re
import json
import logging
from google import genai
from google.genai import types
from typing import Dict, Any

logger = logging.getLogger(__name__)

def analyze_reviews(text_blob: str) -> Dict[str, Any]:
    """
    Analyzes the aggregated text using Google Gemini 3 Flash to extract insights.
    """
    try:
        api_key = os.getenv('GEMINI_API_KEY')
        if not api_key:
            return {"error": "GEMINI_API_KEY not found in environment variables."}

        client = genai.Client(api_key=api_key)

        system_instruction = (
            "You are a brutally honest product analyst who cuts through marketing BS. "
            "Your job is to tell people whether Reddit actually recommends buying this product.\n\n"

            "CRITICAL: Detect and discount suspicious content:\n"
            "- New accounts praising products with no post history = likely shill\n"
            "- Overly enthusiastic reviews with marketing-speak = suspicious\n"
            "- Repetitive talking points across posts = coordinated promotion\n"
            "- Weight authentic, detailed user experiences MORE heavily\n"
            "- Weight low-effort hype or hate LESS\n\n"

            "Return a JSON object with EXACTLY these keys:\n"
            "- 'conclusion': A brutally honest 2-3 sentence verdict. No sugarcoating. "
            "Tell them straight: should they buy it or not? What's the real deal?\n"
            "- 'pros': 3-5 genuine strengths that REAL users consistently mention. "
            "Skip marketing fluff - only include things people actually care about.\n"
            "- 'cons': 3-5 real problems users complain about. Don't downplay issues. "
            "Include dealbreakers if they exist.\n"
            "- 'sentiment_score': The TRUTH INDEX (0-100). This measures how confidently "
            "Reddit would recommend buying this product. Consider:\n"
            "  * 90-100: Universal praise, must-buy, very few complaints\n"
            "  * 70-89: Generally recommended with minor caveats\n"
            "  * 50-69: Mixed opinions, depends on your needs\n"
            "  * 30-49: More complaints than praise, proceed with caution\n"
            "  * 0-29: Widely disliked, Reddit says avoid\n"
            "- 'word_cloud': 15-20 terms/phrases that capture what people ACTUALLY talk about. "
            "Include specific features, common complaints, and comparisons. Each with 'text' and 'value' (1-100 relevance).\n\n"
            "Output ONLY valid JSON. Be real. Be useful. No corporate-speak."
        )

        # Truncate to avoid token limits
        safe_text = text_blob[:30000]

        prompt = f"{system_instruction}\n\nReviews:\n{safe_text}"

        # Request JSON output using new API
        response = client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.2
            )
        )

        content = response.text

        # Parse JSON
        try:
            data = json.loads(content)
            return data
        except json.JSONDecodeError:
            # Fallback regex extraction in case of formatting issues
            match = re.search(r"(\{.*\})", content, re.DOTALL)
            if match:
                return json.loads(match.group(1))
            else:
                logger.error(f"Failed to parse Gemini response: {content}")
                return {"error": "Failed to parse AI response"}

    except Exception as e:
        logger.error(f"Gemini Analysis Error: {e}")
        return {"error": f"AI Analysis failed: {str(e)}"}
