import os
import re
import json
import groq
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

def analyze_reviews(text_blob: str) -> Dict[str, Any]:
    """
    Analyzes the aggregated text using Groq LLM to extract insights.
    """
    try:
        client = groq.Groq(api_key=os.getenv('GROQ_API_KEY'))
        model = "llama-3.3-70b-versatile" 

        system_prompt = (
            "You are an expert product reviewer synthesizing real user opinions from Reddit. "
            "Analyze the following discussion text about a product.\n"
            "Return a JSON object with EXACTLY these keys:\n"
            "- 'conclusion': A concise summary paragraph (2-3 sentences) of the general consensus.\n"
            "- 'pros': A list of 3-5 distinct positive points.\n"
            "- 'cons': A list of 3-5 distinct negative points.\n"
            "- 'sentiment_score': An integer from 0 (terrible) to 100 (perfect).\n"
            "- 'word_cloud': A list of objects, each with 'text' (the word/phrase) and 'value' (relevance/frequency 1-100). Include 15-20 terms.\n"
            "Output ONLY valid JSON."
        )

        # Truncate to avoid token limits if necessary (rule of thumb ~20k chars)
        safe_text = text_blob[:25000]

        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Reviews:\n{safe_text}"}
            ],
            temperature=0.2,
            max_tokens=2048,
            response_format={"type": "json_object"}
        )

        content = response.choices[0].message.content
        
        # Parse JSON
        try:
            data = json.loads(content)
            return data
        except json.JSONDecodeError:
            # Fallback regex extraction
            match = re.search(r"(\{.*\})", content, re.DOTALL)
            if match:
                return json.loads(match.group(1))
            else:
                return {"error": "Failed to parse LLM response"}

    except Exception as e:
        logger.error(f"Groq Analysis Error: {e}")
        return {"error": str(e)}
