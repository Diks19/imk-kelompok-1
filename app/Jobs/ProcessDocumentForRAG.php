<?php

namespace App\Jobs;

use App\Models\Attachment;
use App\Models\DocumentChunk;
use App\Services\OllamaService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class ProcessDocumentForRAG implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public int $attachmentId
    ) {}

    public function handle(OllamaService $ollama): void
    {
        $attachment = Attachment::findOrFail($this->attachmentId);
        
        $relativePath = str_replace('/storage/', '', $attachment->path);
        $fullPath = \Illuminate\Support\Facades\Storage::disk('public')->path($relativePath);

        if (!file_exists($fullPath)) {
            Log::error("File not found for RAG processing: " . $fullPath);
            return;
        }

        $extension = strtolower(pathinfo($fullPath, PATHINFO_EXTENSION));
        $text = '';

        if ($extension === 'pdf') {
            try {
                $parser = new \Smalot\PdfParser\Parser();
                $pdf = $parser->parseFile($fullPath);
                $text = $pdf->getText();
            } catch (\Exception $e) {
                Log::error('PDF parsing error in RAG job: ' . $e->getMessage());
                return;
            }
        } elseif ($extension === 'docx') {
            try {
                $zip = new \ZipArchive;
                if ($zip->open($fullPath) === true) {
                    $content = $zip->getFromName('word/document.xml');
                    $zip->close();
                    if ($content) {
                        $text = strip_tags($content);
                    }
                }
            } catch (\Exception $e) {
                Log::error('DOCX parsing error in RAG job: ' . $e->getMessage());
                return;
            }
        } else {
            // Fallback for all other files: try to read raw text
            $text = @file_get_contents($fullPath);
            if ($text === false) {
                Log::error('Could not read file content for RAG job: ' . $fullPath);
                return;
            }
        }

        if (empty(trim($text))) {
            Log::warning("Empty document ignored for RAG: " . $fullPath);
            return;
        }

        // Simple chunking logic: ~500 words per chunk
        $words = explode(' ', $text);
        $chunks = array_chunk($words, 500);

        foreach ($chunks as $chunkWords) {
            $chunkContent = implode(' ', $chunkWords);
            
            try {
                $embedding = $ollama->getEmbedding($chunkContent);
                
                DocumentChunk::create([
                    'attachment_id' => $attachment->id,
                    'content' => $chunkContent,
                    'embedding' => $embedding,
                ]);
            } catch (\Exception $e) {
                Log::error('Embedding error in RAG job: ' . $e->getMessage());
            }
        }

        Log::info("RAG Ingestion complete for attachment ID: " . $attachment->id);
    }
}
