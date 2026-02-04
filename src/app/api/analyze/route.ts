import { NextRequest, NextResponse } from "next/server";

interface RedditPost {
  title: string;
  selftext: string;
  url: string;
  subreddit: string;
  score: number;
  num_comments: number;
}

interface RedditComment {
  body: string;
}

interface Source {
  title: string;
  url: string;
  subreddit: string;
  score: number;
}

async function getRedditAccessToken(): Promise<string> {
  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Reddit API credentials not configured");
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const response = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": process.env.REDDIT_USER_AGENT || "honestreviews-app/1.0",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    throw new Error("Failed to get Reddit access token");
  }

  const data = await response.json();
  return data.access_token;
}

async function scrapeReddit(
  productName: string
): Promise<{ textBlob: string; sources: Source[] } | { error: string }> {
  const accessToken = await getRedditAccessToken();
  const userAgent = process.env.REDDIT_USER_AGENT || "honestreviews-app/1.0";

  const combinedText: string[] = [];
  const sources: Source[] = [];
  const seenUrls = new Set<string>();

  const queries = [
    `"${productName}" review`,
    `"${productName}" thoughts`,
    `"${productName}" vs`,
    productName,
  ];

  for (const query of queries) {
    if (sources.length >= 6) break;

    try {
      const searchUrl = `https://oauth.reddit.com/r/all/search?q=${encodeURIComponent(query)}&sort=relevance&t=year&limit=6`;

      const searchResponse = await fetch(searchUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "User-Agent": userAgent,
        },
      });

      if (!searchResponse.ok) continue;

      const searchData = await searchResponse.json();
      const posts = searchData.data?.children || [];

      for (const postWrapper of posts) {
        if (sources.length >= 6) break;

        const post: RedditPost = postWrapper.data;

        if (seenUrls.has(post.url)) continue;
        if (post.num_comments < 3) continue;

        seenUrls.add(post.url);

        // Add post content
        let postContent = `### Post from r/${post.subreddit}\n`;
        postContent += `Title: ${post.title}\n`;
        if (post.selftext) {
          postContent += `Body: ${post.selftext.slice(0, 2000)}\n`;
        }
        combinedText.push(postContent);

        // Add source metadata
        sources.push({
          title: post.title,
          url: `https://reddit.com${postWrapper.data.permalink}`,
          subreddit: post.subreddit,
          score: post.score,
        });

        // Fetch top comments
        try {
          const commentsUrl = `https://oauth.reddit.com${postWrapper.data.permalink}?sort=top&limit=15`;
          const commentsResponse = await fetch(commentsUrl, {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "User-Agent": userAgent,
            },
          });

          if (commentsResponse.ok) {
            const commentsData = await commentsResponse.json();
            const comments = commentsData[1]?.data?.children || [];

            let commentCount = 0;
            for (const commentWrapper of comments) {
              if (commentCount >= 15) break;
              const comment: RedditComment = commentWrapper.data;
              if (
                comment.body &&
                comment.body !== "[removed]" &&
                comment.body !== "[deleted]" &&
                comment.body.length > 20
              ) {
                combinedText.push(`Comment: ${comment.body.slice(0, 1500)}`);
                commentCount++;
              }
            }
          }
        } catch {
          // Continue if comments fail
        }
      }
    } catch {
      continue;
    }
  }

  if (combinedText.length === 0) {
    return {
      error: `No Reddit discussions found for '${productName}'. Try a more specific name.`,
    };
  }

  return {
    textBlob: combinedText.join("\n\n"),
    sources,
  };
}

async function analyzeWithGemini(
  textBlob: string
): Promise<Record<string, unknown> | { error: string }> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return { error: "GEMINI_API_KEY not configured" };
  }

  const systemInstruction = `You are a brutally honest product analyst who cuts through marketing BS. Your job is to tell people whether Reddit actually recommends buying this product.

CRITICAL: Detect and discount suspicious content:
- New accounts praising products with no post history = likely shill
- Overly enthusiastic reviews with marketing-speak = suspicious
- Repetitive talking points across posts = coordinated promotion
- Weight authentic, detailed user experiences MORE heavily
- Weight low-effort hype or hate LESS

Return a JSON object with EXACTLY these keys:
- 'conclusion': A brutally honest 2-3 sentence verdict. No sugarcoating. Tell them straight: should they buy it or not? What's the real deal?
- 'pros': 3-5 genuine strengths that REAL users consistently mention. Skip marketing fluff - only include things people actually care about.
- 'cons': 3-5 real problems users complain about. Don't downplay issues. Include dealbreakers if they exist.
- 'sentiment_score': The TRUTH INDEX (0-100). This measures how confidently Reddit would recommend buying this product. Consider:
  * 90-100: Universal praise, must-buy, very few complaints
  * 70-89: Generally recommended with minor caveats
  * 50-69: Mixed opinions, depends on your needs
  * 30-49: More complaints than praise, proceed with caution
  * 0-29: Widely disliked, Reddit says avoid
- 'word_cloud': 15-20 terms/phrases that capture what people ACTUALLY talk about. Include specific features, common complaints, and comparisons. Each with 'text' and 'value' (1-100 relevance).

Output ONLY valid JSON. Be real. Be useful. No corporate-speak.`;

  const safeText = textBlob.slice(0, 30000);
  const prompt = `${systemInstruction}\n\nReviews:\n${safeText}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", errorText);
      return { error: "AI analysis failed" };
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      return { error: "Empty response from AI" };
    }

    try {
      return JSON.parse(content);
    } catch {
      // Try to extract JSON from response
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        return JSON.parse(match[0]);
      }
      return { error: "Failed to parse AI response" };
    }
  } catch (err) {
    console.error("Gemini analysis error:", err);
    return { error: "AI analysis failed" };
  }
}

export async function GET() {
  return NextResponse.json({ status: "API is working", method: "GET" });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const productName = body.product_name;

    if (!productName || typeof productName !== "string" || !productName.trim()) {
      return NextResponse.json(
        { detail: "Product name is required" },
        { status: 400 }
      );
    }

    // 1. Scrape Reddit
    const scrapeResult = await scrapeReddit(productName);

    if ("error" in scrapeResult) {
      return NextResponse.json({ detail: scrapeResult.error }, { status: 400 });
    }

    // 2. Analyze with AI
    const analysisResult = await analyzeWithGemini(scrapeResult.textBlob);

    if ("error" in analysisResult) {
      return NextResponse.json(
        { detail: analysisResult.error },
        { status: 500 }
      );
    }

    // 3. Return response
    return NextResponse.json({
      product: productName,
      analysis: analysisResult,
      sources: scrapeResult.sources,
    });
  } catch (err) {
    console.error("API error:", err);
    return NextResponse.json(
      { detail: "Something went wrong while consulting Reddit." },
      { status: 500 }
    );
  }
}
