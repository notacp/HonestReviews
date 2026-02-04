import praw
import prawcore
import os
from typing import List, Dict, Optional

# --- Category Data ---
subreddit_categories = {
    "General": ["BuyItForLife", "GoodValue", "productreviews", "Frugal", "HelpMeFind", "whatshouldibuy"],
    "Technology & Electronics": [
        "technology", "gadgets", "hardware", "laptops", "suggestalaptop", "buildapc", "pcmasterrace", 
        "Android", "ios", "smartphones", "headphones", "audiophile", "MouseReview", "Monitors", 
        "techsupport", "apple", "Microsoft", "GooglePixel", "HomeAutomation", "Networking"
    ],
    "Home Goods & Appliances": [
        "Appliances", "HomeImprovement", "vacuumcleaners", "Coffee", "Cooking", "BuyItForLife", 
        "CleaningTips", "furniture", "Mattress", "homeautomation"
    ],
    "Fashion & Apparel": [
        "malefashionadvice", "femalefashionadvice", "OUTFITS", "fashionadvice", "goodyearwelt", 
        "rawdenim", "Watches", "streetwear", "frugalmalefashion", "frugalfemalefashion", "backpacks"
    ],
    "Beauty & Personal Care": [
        "SkincareAddiction", "MakeupAddiction", "AsianBeauty", "beauty", "wicked_edge", "fragrance", 
        "HaircareScience", "brownbeauty", "VeganBeauty", "CrueltyFreeMUA"
    ],
    "Outdoors, Sports & Travel Gear": [
        "CampingandHiking", "CampingGear", "outdoors", "hiking", "Backpacking", "Ultralight", 
        "WildernessBackpacking", "Cycling", "RunningShoeGeeks", "onebag", "travel", "skiing", 
        "snowboarding", "Fishing", "ClimbingGear"
    ],
    "Hobbies & Specific Interests": [
        "Gaming", "pcgaming", "photography", "audiophile", "headphones", "MechanicalKeyboards", 
        "books", "suggestmeabook", "boardgames", "lego", "gardening", "DIY", "Gunpla", "Homebrewing"
    ]
}

def get_reddit_client():
    return praw.Reddit(
        client_id=os.getenv('REDDIT_CLIENT_ID'),
        client_secret=os.getenv('REDDIT_CLIENT_SECRET'),
        user_agent=os.getenv('REDDIT_USER_AGENT', 'honestreviews-app'),
        read_only=True
    )

import logging

logger = logging.getLogger(__name__)

def scrape_reddit(product_name: str, category: str, max_posts: int = 5, max_comments: int = 10) -> Dict:
    """
    Scrapes Reddit and returns a structured dictionary with combined text and validation details.
    """
    subreddits = subreddit_categories.get(category)
    if not subreddits:
        return {"error": "Invalid category"}

    reddit = get_reddit_client()
    combined_text = []
    sources = []
    
    # Track stats
    posts_found = 0
    
    logger.info(f"Scraping for '{product_name}' in {category}...")

    for sub_name in subreddits:
        if posts_found >= max_posts * 2: # Optimization: Stop if we have enough sources
            break
            
        clean_sub_name = sub_name.replace("r/", "")
        try:
            subreddit = reddit.subreddit(clean_sub_name)
            submissions = subreddit.search(product_name, sort='relevance', limit=max_posts)
            
            for submission in submissions:
                posts_found += 1
                
                # Add Post Content
                post_content = f"Title: {submission.title}\n"
                if submission.selftext:
                    post_content += f"Body: {submission.selftext}\n"
                
                combined_text.append(post_content)
                
                # Add Source Metadata
                sources.append({
                    "title": submission.title,
                    "url": submission.url,
                    "subreddit": clean_sub_name,
                    "score": submission.score
                })

                # Add Comments
                submission.comment_sort = 'top'
                submission.comments.replace_more(limit=0)
                count = 0
                for comment in submission.comments.list():
                    if count >= max_comments: break
                    if comment.body and comment.body not in ['[removed]', '[deleted]']:
                        combined_text.append(f"Comment: {comment.body}")
                        count += 1
                        
        except Exception as e:
            logger.error(f"Error scraping r/{clean_sub_name}: {e}")
            continue

    if not combined_text:
        return {"error": "No results found"}

    return {
        "text_blob": "\n\n".join(combined_text),
        "sources": sources
    }
