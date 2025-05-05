import gradio as gr
import os
import praw
import prawcore # Import for exception handling
import groq    # NEW: For Groq API
import json    # NEW: For parsing LLM output
import re      # NEW: For text cleaning

# --- Category Data ---
# Define the categories and their associated subreddits
subreddit_categories = {
    "General": [
        "BuyItForLife", "GoodValue", "productreviews", "Frugal",
        "HelpMeFind", "whatshouldibuy",
    ],
    "Technology & Electronics": [
        "technology", "gadgets", "hardware", "laptops",
        "suggestalaptop", "buildapc", "pcmasterrace", "Android",
        "ios", "smartphones", "headphones", "audiophile",
        "MouseReview", "Monitors", "techsupport", "apple",
        "Microsoft", "GooglePixel", "HomeAutomation", "Networking",
    ],
    "Home Goods & Appliances": [
        "Appliances", "HomeImprovement", "vacuumcleaners", "Coffee",
        "Cooking", "BuyItForLife", "CleaningTips", "furniture",
        "Mattress", "homeautomation",
    ],
    "Fashion & Apparel": [
        "malefashionadvice", "femalefashionadvice", "OUTFITS",
        "fashionadvice", "goodyearwelt", "rawdenim", "Watches",
        "streetwear", "frugalmalefashion", "frugalfemalefashion",
        "backpacks",
    ],
    "Beauty & Personal Care": [
        "SkincareAddiction", "MakeupAddiction", "AsianBeauty", "beauty",
        "wicked_edge", "fragrance", "HaircareScience", "brownbeauty",
        "VeganBeauty", "CrueltyFreeMUA",
    ],
    "Outdoors, Sports & Travel Gear": [
        "CampingandHiking", "CampingGear", "outdoors", "hiking",
        "Backpacking", "Ultralight", "WildernessBackpacking", "Cycling",
        "RunningShoeGeeks", "onebag", "travel", "skiing",
        "snowboarding", "Fishing", "ClimbingGear", "backpacks",
    ],
    "Hobbies & Specific Interests": [
        "Gaming", "pcgaming", "photography", "audiophile",
        "headphones", "MechanicalKeyboards", "books", "suggestmeabook",
        "boardgames", "lego", "gardening", "DIY", "Gunpla",
        "Homebrewing",
    ],
    # Add more categories and subreddits as needed
}


# --- Reddit Scraping Function ---
# Modified to accept category
def scrape_reddit(product_name: str, category: str, max_posts: int = 5, max_comments: int = 10) -> str:
    """
    Scrapes Reddit for discussions about a given product name within a specific category.

    Args:
        product_name: The name of the product to search for.
        category: The selected product category.
        max_posts: The maximum number of posts to fetch per subreddit.
        max_comments: The maximum number of comments to fetch per post.

    Returns:
        A single string containing concatenated titles, selftexts, and comments,
        or an ERROR string if scraping fails or category is invalid.
    """
    collected_texts = []
    # Get subreddits for the selected category
    subreddits_to_search = subreddit_categories.get(category)
    if not subreddits_to_search:
        print(f"Error: Invalid or unknown category selected: {category}")
        return "ERROR: Invalid category selected."

    print(f"Selected category: {category}")
    print(f"Subreddits to search: {subreddits_to_search}")

    try:
        reddit = praw.Reddit(
            client_id=os.getenv('REDDIT_CLIENT_ID'),
            client_secret=os.getenv('REDDIT_CLIENT_SECRET'),
            user_agent=os.getenv('REDDIT_USER_AGENT'),
            read_only=True # Good practice for scraping
        )

        print(f"Scraping Reddit for: {product_name} in category '{category}'")
        for sub_name in subreddits_to_search:
            # PRAW expects subreddit names without 'r/' prefix
            clean_sub_name = sub_name.replace("r/", "")
            print(f"Searching in r/{clean_sub_name}...")
            subreddit = reddit.subreddit(clean_sub_name)
            try:
                # Search for the product name, sort by relevance or top
                submissions = subreddit.search(product_name, sort='relevance', limit=max_posts)
                post_count_in_sub = 0
                for submission in submissions:
                    post_count_in_sub += 1
                    collected_texts.append(f"Post Title (r/{clean_sub_name}): {submission.title}")
                    if submission.selftext:
                        collected_texts.append(f"Post Body: {submission.selftext}")

                    # Fetch comments
                    submission.comment_sort = 'top' # or 'best'
                    submission.comments.replace_more(limit=0) # Remove MoreComments objects
                    comment_count = 0
                    for comment in submission.comments.list():
                        if comment_count >= max_comments:
                            break
                        if comment.body and comment.body != '[removed]' and comment.body != '[deleted]':
                           collected_texts.append(f"Comment: {comment.body}")
                           comment_count += 1
                print(f"Found {post_count_in_sub} relevant posts in r/{clean_sub_name}")

            except prawcore.exceptions.Forbidden:
                 print(f"Warning: Cannot access r/{clean_sub_name}. Skipping.")
            except prawcore.exceptions.NotFound:
                 print(f"Warning: Subreddit r/{clean_sub_name} not found. Skipping.")
            except Exception as e:
                 print(f"Warning: Error searching in r/{clean_sub_name}: {e}")

        print(f"Finished scraping for category '{category}'. Found {len(collected_texts)} text pieces.")
        if not collected_texts:
            return "NOTICE: No relevant discussions found in the selected category's subreddits."
        return "\n\n".join(collected_texts)

    except prawcore.exceptions.ResponseException as e:
        print(f"Error during Reddit API authentication or request: {e}")
        return "ERROR: Reddit API access failed. Check credentials or network."
    except Exception as e:
        print(f"An unexpected error occurred during Reddit scraping: {e}")
        return f"ERROR: An unexpected error occurred during scraping: {e}"

# --- Groq LLM Analysis Function ---
def analyze_text_with_groq(text_blob: str) -> dict:
    """
    Sends the scraped text to Groq LLM for analysis and returns a dict with
    'conclusion', 'pros', and 'cons'.
    """
    try:
        client = groq.Groq(api_key=os.getenv('GROQ_API_KEY'))
        model = "llama-3.3-70b-versatile"  # or "mixtral-8x7b-32768"
        system_prompt = (
            "You are a helpful assistant that summarizes real user reviews from forums. "
            "Given a large block of user comments and posts about a product, extract:\n"
            "- A concise overall conclusion about the product's reputation and sentiment.\n"
            "- A list of pros (positive points mentioned by users).\n"
            "- A list of cons (negative points mentioned by users).\n"
            "Return your answer STRICTLY as a single, complete JSON object with keys: conclusion, pros, cons. "
            "Output ONLY the JSON object, with no introductory text or explanations before or after it. "
            "Example:\n"
            "{\"conclusion\": \"...\", \"pros\": [\"...\", \"...\"], \"cons\": [\"...\", \"...\"]}"
        )
        user_prompt = (
            f"Here are user discussions about a product:\n\n{text_blob}\n\n"
            "Summarize as described above. Output only the JSON object."
        )
        print("Requesting JSON object format from Groq...")
        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.2,
            max_tokens=1024,
            response_format={"type": "json_object"}
        )
        # Extract the model's reply
        raw_content = response.choices[0].message.content
        print(f"Raw Groq response content (JSON mode requested):\n---\n{raw_content}\n---")

        # Attempt to extract JSON block using regex (should ideally be redundant now, but kept as safeguard)
        # Tries to find ```json { ... } ``` first, then falls back to just { ... }
        match = re.search(r"```json\s*(\{.*?\})\s*```|(\{.*?\})", raw_content, re.DOTALL)

        if match:
            # Extract the JSON part from the matched group
            # Group 1 captures JSON within fences, Group 2 captures JSON without fences
            json_string = match.group(1) if match.group(1) else match.group(2)
            try:
                # With response_format set, json_string should be valid JSON already
                result = json.loads(json_string)
                # Ensure all keys exist
                return {
                    "conclusion": result.get("conclusion", "No conclusion found."),
                    "pros": result.get("pros", []),
                    "cons": result.get("cons", []),
                }
            except json.JSONDecodeError as e:
                # This error is less likely now but handled just in case
                print(f"JSONDecodeError even after requesting JSON format and regex extraction: {e}")
                print("Extracted string causing error:", json_string)
                return {
                    "conclusion": f"Analysis failed: LLM output was not valid JSON despite format request. Error: {e}",
                    "pros": [],
                    "cons": [],
                }
        else:
            # Fallback or error if no JSON structure found (also less likely now)
            print("Groq output did not contain a recognizable JSON structure despite requesting JSON format.")
            print(f"Raw content received: {raw_content}")
            return {
                "conclusion": "Analysis failed: LLM response did not contain JSON despite format request.",
                "pros": [],
                "cons": [],
            }

    except groq.APIError as e:
        print(f"Groq API error: {e}")
        # Check if it's an invalid request due to response_format
        if "response_format" in str(e):
             print("Error may be due to the model not supporting response_format={'type': 'json_object'}. Consider removing it if issues persist.")
             return {
                 "conclusion": f"Analysis failed: Model may not support JSON mode.",
                 "pros": [],
                 "cons": [],
             }
        return {
            "conclusion": f"Error during analysis: Groq API Error ({e.status_code})",
            "pros": [],
            "cons": [],
        }
    except Exception as e:
        print(f"Unexpected error during Groq analysis: {e}")
        return {
            "conclusion": f"Error during analysis: {e}",
            "pros": [],
            "cons": [],
        }

# --- Gradio App Logic ---
# Modified to accept category
def analyze_product_pipeline(category: str, product_name: str):
    """
    Main pipeline: Checks category, scrapes Reddit, then analyzes with Groq.
    """
    print(f"Starting analysis pipeline for: {product_name} in category: {category}")

    # --- Constants ---
    # Estimate based on ~3.5 chars/token to stay under 12k token limit
    MAX_INPUT_CHARS = 38500

    # --- Input Validation ---
    if not category:
        print("Pipeline aborted: No category selected.")
        # Return message for conclusion, and specific strings for pros/cons areas
        return "Please select a product category first.", "### Pros\n-", "### Cons\n-"

    if not product_name or not product_name.strip():
        print("Pipeline aborted: No product name entered.")
        return "Please enter a product name.", "### Pros\n-", "### Cons\n-"

    # --- Step 1: Scrape Reddit ---
    # Pass category to the scraping function
    scraped_text = scrape_reddit(product_name.strip(), category)

    # Handle scraping errors or lack of results
    if scraped_text.startswith("ERROR:") or scraped_text.startswith("NOTICE:"):
        error_or_notice = scraped_text.split(":", 1)[1].strip() # Get message after type
        print(f"Scraping result: {error_or_notice}")
        # Return error/notice message for conclusion, and N/A for pros/cons areas
        return error_or_notice, "### Pros\nN/A", "### Cons\nN/A"

    # --- Step 1.5: Clean scraped text ---
    print(f"Original scraped text length: {len(scraped_text)}")
    cleaned_text = re.sub(r'\s+', ' ', scraped_text).strip()
    print(f"Cleaned text length: {len(cleaned_text)}")

    # --- Step 1.6: Truncate if necessary ---
    if len(cleaned_text) > MAX_INPUT_CHARS:
        print(f"Warning: Input text exceeds {MAX_INPUT_CHARS} chars. Truncating...")
        cleaned_text = cleaned_text[:MAX_INPUT_CHARS]
        print(f"Truncated text length: {len(cleaned_text)}")
    # -------------------------------------

    # --- Step 2: Analyze with Groq ---
    analysis = analyze_text_with_groq(cleaned_text)

    # Check for analysis errors
    if analysis["conclusion"].startswith("Error during analysis") or analysis["conclusion"].startswith("Analysis failed"):
        print(f"Analysis result: {analysis['conclusion']}")
        # Return error message for conclusion, and specific strings for pros/cons areas
        return analysis["conclusion"], "### Pros\nAnalysis Error", "### Cons\nAnalysis Error"

    # --- Format and Return Success ---
    conclusion = analysis.get("conclusion", "No conclusion found.")
    pros = analysis.get("pros", [])
    cons = analysis.get("cons", [])

    print(f"Analysis successful. Conclusion: {conclusion[:100]}...") # Log snippet

    # Format lists for Markdown display with titles
    if pros:
        pros_md = "### Pros\n" + "\n".join(f"- {pro}" for pro in pros)
    else:
        pros_md = "### Pros\nNone found."

    if cons:
        cons_md = "### Cons\n" + "\n".join(f"- {con}" for con in cons)
    else:
        cons_md = "### Cons\nNone found."

    return conclusion, pros_md, cons_md

# --- Gradio Interface ---
with gr.Blocks(theme=gr.themes.Monochrome()) as demo: # Changed theme to Monochrome
    gr.Markdown("# HonestReviews\nGet unbiased product insights from Reddit discussions.")

    with gr.Column(): # Use column for vertical layout
        category_input = gr.Dropdown(
            label="Select Product Category",
            choices=list(subreddit_categories.keys()), # Populate from dict keys
            value=None # Default to no selection
        )
        product_input = gr.Textbox(
            label="Enter Product Name",
            placeholder="e.g., Sony WH-1000XM5"
        )
        analyze_button = gr.Button("Analyze Reviews")

    with gr.Column():
        conclusion_output = gr.Textbox(label="Conclusion", interactive=False, lines=3) # Allow more lines
        # Use gr.HTML for potentially better list rendering control if needed later
        pros_output = gr.Markdown()
        cons_output = gr.Markdown()

    # Update click handler inputs
    analyze_button.click(
        fn=analyze_product_pipeline,
        # Inputs now include category_input first
        inputs=[category_input, product_input],
        outputs=[conclusion_output, pros_output, cons_output]
    )

if __name__ == "__main__":
    demo.launch() 