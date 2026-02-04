import praw
import prawcore
import os
import logging
from typing import List, Dict, Optional

# Setup Logging
logger = logging.getLogger(__name__)

def get_reddit_client():
    return praw.Reddit(
        client_id=os.getenv('REDDIT_CLIENT_ID'),
        client_secret=os.getenv('REDDIT_CLIENT_SECRET'),
        user_agent=os.getenv('REDDIT_USER_AGENT', 'honestreviews-app'),
        read_only=True
    )

def scrape_reddit(product_name: str, max_posts: int = 6, max_comments: int = 15) -> Dict:
    """
    Dynamically finds relevant subreddits and scrapes content for a product.
    1. Searches for "{product_name} review" across all subreddits.
    2. Identifies the most relevant threads.
    3. Extracts content and metadata.
    """
    reddit = get_reddit_client()
    combined_text = []
    sources = []
    seen_urls = set()
    
    # Search queries to try
    queries = [
        f'"{product_name}" review',
        f'"{product_name}" thoughts',
        f'"{product_name}" vs',
        product_name
    ]
    
    logger.info(f"Starting dynamic discovery for: {product_name}")

    for search_query in queries:
        if len(sources) >= max_posts:
            break
            
        try:
            # Search across all subreddits for relevant threads
            submissions = reddit.subreddit("all").search(
                search_query, 
                sort='relevance', 
                time_filter='year', 
                limit=max_posts
            )
            
            for submission in submissions:
                if len(sources) >= max_posts:
                    break
                    
                if submission.url in seen_urls:
                    continue
                
                # Filter for likely review content
                # We want threads with comments and reasonable scores
                if submission.num_comments < 3:
                    continue

                seen_urls.add(submission.url)
                
                # Add Post Content
                post_content = f"### Post from r/{submission.subreddit.display_name}\n"
                post_content += f"Title: {submission.title}\n"
                if submission.selftext:
                    # Truncate extremely long posts
                    post_content += f"Body: {submission.selftext[:2000]}\n"
                
                combined_text.append(post_content)
                
                # Add Source Metadata
                sources.append({
                    "title": submission.title,
                    "url": submission.url,
                    "subreddit": submission.subreddit.display_name,
                    "score": submission.score
                })

                # Add Top Comments
                submission.comment_sort = 'top'
                submission.comments.replace_more(limit=0)
                
                comment_count = 0
                for comment in submission.comments.list():
                    if comment_count >= max_comments:
                        break
                    if comment.body and comment.body not in ['[removed]', '[deleted]'] and len(comment.body) > 20:
                        combined_text.append(f"Comment: {comment.body[:1500]}")
                        comment_count += 1
                        
        except Exception as e:
            logger.error(f"Error during dynamic search query '{search_query}': {e}")
            continue

    if not combined_text:
        return {"error": f"No Reddit discussions found for '{product_name}'. Try a more specific name."}

    logger.info(f"Found {len(sources)} relevant threads across {len(set(s['subreddit'] for s in sources))} subreddits.")

    return {
        "text_blob": "\n\n".join(combined_text),
        "sources": sources
    }
