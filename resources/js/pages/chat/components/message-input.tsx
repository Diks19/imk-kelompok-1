import React, { useState } from 'react';

interface MessageInputProps {
    onSubmit: (prompt: string) => void;
    disabled?: boolean;
}

export function MessageInput({ onSubmit, disabled }: MessageInputProps) {
    const [prompt, setPrompt] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim() || disabled) return;
        onSubmit(prompt);
        setPrompt('');
    };

    return (
        <div className="p-4 border-t border-gray-200">
            <form onSubmit={handleSubmit} className="max-w-3xl mx-auto flex gap-2">
                <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    placeholder="Message LarAI..."
                    aria-label="Prompt"
                    disabled={disabled}
                />
                <button
                    type="submit"
                    className="bg-blue-600 text-white rounded-lg px-4 py-2 font-medium hover:bg-blue-700 disabled:opacity-50"
                    disabled={disabled}
                >
                    Send
                </button>
            </form>
        </div>
    );
}
