<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Class GardenMember
 *
 * @property int $id
 * @property int $garden_id
 * @property int $user_id
 * @property string $role
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 *
 * @property-read Garden $garden
 * @property-read User $user
 */
class GardenMember extends Model
{
    use HasFactory;

    public const ROLE_OWNER = 'OWNER';
    public const ROLE_MANAGER = 'MANAGER';

    protected $fillable = [
        'garden_id',
        'user_id',
        'role',
    ];

    public function garden(): BelongsTo
    {
        return $this->belongsTo(Garden::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
