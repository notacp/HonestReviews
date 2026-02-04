"use client";

import { useState } from "react";
import { Search } from "lucide-react";

interface SearchBarProps {
    onSearch: (product: string) => void;
    isLoading: boolean;
}

export const SearchBar = ({ onSearch, isLoading }: SearchBarProps) => {
    const [product, setProduct] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (product.trim()) {
            onSearch(product);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="w-full max-w-2xl space-y-6"
            role="search"
        >
            <div className="relative glass-input p-1 focus-within:ring-2 ring-black/5">
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
