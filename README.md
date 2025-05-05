### 🕵️‍♂️ HonestReviews

**No fake stars. No paid reviews. Just real opinions.**

HonestReviews is a lightweight web app that helps users make smarter purchasing decisions by **scraping authentic product reviews from Reddit** — bypassing the sea of fake reviews found on platforms like Amazon and Flipkart.

---

## 🔍 What It Does

> ✅ **Search for a product**  
> ✅ **Pulls real user experiences from Reddit threads**  
> ✅ **Highlights pros, cons, and recurring patterns**  
> ✅ **Returns a clear, no-fluff summary to help you decide**  

Whether you're buying headphones, skincare, or laptops — HonestReviews gives you the **raw truth** directly from the people who've actually used the product.

---

## 🚀 Features

- 🔎 **Category + Product Search**
- 🤖 **Reddit comment scraping**
- 🧠 **Basic sentiment parsing for pros/cons**
- 🧼 **Clean UI for review summaries**
- 🧵 Direct Reddit thread links for deeper exploration

---

## 🧠 Why It Exists

Fake reviews plague most ecommerce platforms.  
HonestReviews was built to solve this **trust gap** by leveraging communities like Reddit, where real people share real experiences — without an incentive to sell you something.

---

## 🛠️ Tech Stack

- **Frontend:** Gradio (Choose based on your stack)
- **Backend:** Python, PRAW (Reddit API), BeautifulSoup
- **NLP:** TextBlob / VADER (for sentiment analysis)
- **Deployment:** Hugging Face Spaces
---

## 📦 Installation

```bash
git clone https://github.com/yourusername/honestreviews.git
cd honestreviews
pip install -r requirements.txt
python app.py
```

> ⚠️ Make sure to set your Reddit API credentials in a `.env` file:
```env
REDDIT_CLIENT_ID=your_id
REDDIT_CLIENT_SECRET=your_secret
REDDIT_USER_AGENT=honestreviews-app
```

---

## 🔗 Live Demo

👉 https://huggingface.co/spaces/notacp/HonestReviews

---

## 🤝 Contributions

Have an idea to make this better?  
Found a bug?  
Want to improve sentiment accuracy?

Feel free to open an issue or submit a PR. Let’s make online shopping honest again.

---

## 📄 License

MIT License  
Built with ❤️ to help people make better decisions.

---

## 👨‍💻 Author

Made by [Pradyumn Khanchandani](https://www.linkedin.com/in/pradyumn-khanchandani/) — a Generative AI creator building tools that solve real problems.
