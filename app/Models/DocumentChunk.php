<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DocumentChunk extends Model
{
    protected $guarded = [];

    protected $casts = [
        'embedding' => 'array',
    ];

    public function attachment(): BelongsTo
    {
        return $this->belongsTo(Attachment::class);
    }
}
