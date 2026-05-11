<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class StableDiffusionService
{
    protected string $baseUrl;

    public function __construct()
    {
        $this->baseUrl = config('services.stable_diffusion.url', 'http://127.0.0.1:7860');
    }

    public function generate(string $prompt): string
    {
        $response = Http::timeout(300)->post("{$this->baseUrl}/sdapi/v1/txt2img", [
            'prompt' => $prompt,
            'steps' => 20,
            'width' => 512,
            'height' => 512,
        ])->throw();

        $imageData = $response->json('images.0');
        
        if (!$imageData) {
            throw new \Exception('No image returned from Stable Diffusion');
        }

        $fileName = 'generated/' . Str::random(40) . '.png';
        Storage::disk('public')->put($fileName, base64_decode($imageData));

        return '/storage/' . $fileName;
    }
}
