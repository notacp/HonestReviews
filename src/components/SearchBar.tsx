"use client";

import { useState } from "react";
import { Search } from "lucide-react";

interface SearchBarProps {
    onSearch: (product: string, category: string) => void;
    isLoading: boolean;
    categories: string[];
}

export const SearchBar = ({ onSearch, isLoading, categories = [] }: SearchBarProps) => {
    const [product, setProduct] = useState("");
    const initialCategory = categories.length > 0 ? categories[0] : "";
    const [category, setCategory] = useState(initialCategory);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (product.trim()) {
            onSearch(product, category);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="w-full max-w-2xl space-y-6"
            role="search"
        >
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative glass-input p-1 focus-within:ring-2 ring-black/5">
                    <input
                        type="text"
                        value={product}
                        onChange={(e) => setProduct(e.target.value)}
                        placeholder="Search product (e.g. Sony WH-1000XM5)"
                        aria-label="Product name"
                        className="w-full h-12 pl-12 pr-4 bg-transparent outline-none text-lg font-medium tracking-tight"
                        disabled={isLoading}
                    />
                    <Search className="absolute left-4 top-4 text-black w-5 h-5 opacity-40" aria-hidden="true" />
                </div>

                <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    aria-label="Product category"
                    className="h-14 px-6 glass rounded-2xl outline-none bg-transparent cursor-pointer text-sm font-bold tracking-tight text-gray-600 border-none appearance-none"
                    disabled={isLoading}
                >
                    {categories.map((cat) => (
                        <option key={cat} value={cat}>
                            {cat}
                        </option>
                    ))}
                </select>
            </div>

            <button
                type="submit"
                disabled={isLoading || !product.trim()}
                className="w-full h-14 bg-black text-white rounded-2xl font-black text-lg tracking-tight shadow-2xl hover:bg-gray-900 transition-all disabled:opacity-20 active:scale-[0.98]"
            >
                {isLoading ? "Consulting Reddit..." : "Get Honest Review"}
            </button>
        </form>
    );
};
