import { SendHorizontal, Paperclip, X } from 'lucide-react';
import React, { useState, useRef } from 'react';

interface MessageInputProps {
    onSubmit: (prompt: string, image?: File | null) => void;
    disabled?: boolean;
}

export function MessageInput({ onSubmit, disabled }: MessageInputProps) {
    const [prompt, setPrompt] = useState('');
    const [image, setImage] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if ((!prompt.trim() && !image) || disabled) return;
        onSubmit(prompt, image);
        setPrompt('');
        setImage(null);
        setPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImage(file);
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setPreview(reader.result as string);
                };
                reader.readAsDataURL(file);
            } else {
                setPreview(null);
            }
        }
    };

    return (
        <div className="w-full space-y-4">
            {image && (
                <div className="relative inline-block animate-in zoom-in-95 duration-200 mb-2 pl-4">
                    {preview ? (
                        <img 
                            src={preview} 
                            alt="Preview" 
                            className="h-32 w-auto rounded-xl border border-zinc-200 dark:border-zinc-700 object-cover shadow-2xl" 
                        />
                    ) : (
                        <div className="flex items-center gap-3 p-4 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-purple-600 dark:text-purple-400 border border-zinc-200 dark:border-zinc-700 shadow-2xl pr-10">
                            <span className="text-2xl">📄</span>
                            <span className="truncate max-w-[200px] text-sm font-medium text-zinc-900 dark:text-zinc-100">{image.name}</span>
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={() => { 
                            setImage(null); 
                            setPreview(null); 
                            if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="absolute -top-2 -right-2 size-6 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-600 rounded-full flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors shadow-lg cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700"
                    >
                        <X className="size-3" />
                    </button>
                </div>
            )}
            <form 
                onSubmit={handleSubmit} 
                className="relative flex items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full p-2 focus-within:ring-2 focus-within:ring-purple-500/50 focus-within:border-purple-500/50 transition-all shadow-xl font-sans"
            >
                <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                />
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`size-12 flex items-center justify-center rounded-full transition-all shrink-0 ml-1 ${
                        image ? 'text-purple-600 dark:text-purple-400 bg-purple-500/10' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
                    }`}
                    title="Upload file or image"
                    disabled={disabled}
                >
                    <Paperclip className="size-5" />
                </button>
                <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="flex-1 bg-transparent border-none px-4 py-3 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:outline-none disabled:opacity-50 text-base"
                    placeholder="Message LarAI..."
                    aria-label="Prompt"
                    disabled={disabled}
                />
                <button
                    type="submit"
                    className="size-10 flex items-center justify-center bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-full hover:bg-zinc-800 dark:hover:bg-white active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 shrink-0 mr-1"
                    disabled={(!prompt.trim() && !image) || disabled}
                >
                    <SendHorizontal className="size-5" />
                </button>
            </form>
            <p className="text-xs text-center text-zinc-500 font-medium pb-2">
                LarAI may display inaccurate info, so double-check its responses.
            </p>
        </div>
    );
}
