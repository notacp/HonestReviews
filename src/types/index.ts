export interface Analysis {
    conclusion: string;
    pros: string[];
    cons: string[];
    sentiment_score: number;
    word_cloud: { text: string; value: number }[];
}

export interface Source {
    title: string;
    url: string;
    subreddit: string;
    score: number;
}

export interface SearchResult {
    product: string;
    category: string;
    analysis: Analysis;
    sources: Source[];
}

export interface SearchHistoryItem {
    product: string;
    category: string;
}
