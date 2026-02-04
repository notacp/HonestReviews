# 🕵️‍♂️ HonestReviews

**No fake stars. No paid reviews. Just real opinions.**

HonestReviews is a premium web application that helps users make smarter purchasing decisions by scraping and analyzing authentic product reviews from Reddit. It bypasses the sea of fake and sponsored reviews found on major e-commerce platforms using AI-driven sentiment analysis.

## ✨ Features

- **Reddit Scraping**: Pulls recent discussions from relevant subreddits.
- **AI Analysis**: Powered by Groq (LLAMA 3.3) for sentiment scoring and consensus summaries.
- **Minimalist Glassmorphism**: A state-of-the-art UI inspired by Notion and Medium.
- **Sentiment Gauge**: Visual 0-100 "Truth Score" for every product.
- **Key Themes**: Dynamic word cloud visualizing recurring patterns.
- **Recent Searches**: Persistent history for quick re-access.

## 🛠 Tech Stack

- **Frontend**: Next.js 15 (App Router), Tailwind CSS, Framer Motion.
- **Backend**: FastAPI (Python), PRAW (Reddit API), Groq (LLM).
- **Deployment**: Optimized for Vercel Serverless Functions.

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Python 3.9+
- Reddit API Credentials
- Groq API Key

### Backend Setup

1. From the project root:
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn api.main:app --reload
```

### Frontend Setup

1. Install dependencies:
```bash
npm install
```
2. Run development server:
```bash
npm run dev
```

## 📄 License

MIT
