<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Support\Facades\Storage;

/**
 * Class Garden
 *
 * @property int $id
 * @property string $name
 * @property string|null $description
 * @property string|null $location
 * @property float|null $area_hectares
 * @property mixed $area          Raw GEOMETRY binary. Read via ST_AsGeoJSON() in GardenController.
 * @property string|null $image_path  Relative path in storage/app/public/gardens/
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 *
 * @property-read string|null $image_url   Public URL (appended by controller or accessor)
 * @property-read \Illuminate\Database\Eloquent\Collection<int, Plant> $plants
 * @property-read \Illuminate\Database\Eloquent\Collection<int, GardenMember> $members
 * @property-read \Illuminate\Database\Eloquent\Collection<int, User> $users
 */
class Garden extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'location',
        'area_hectares',
        'image_path',
        // 'area' is intentionally excluded — must be written via ST_GeomFromGeoJSON()
    ];

    protected $casts = [
        'area_hectares' => 'decimal:4',
    ];

    /**
     * Hide the raw GEOMETRY binary from serialization.
     * image_path is also hidden; the controller exposes image_url instead.
     */
    protected $hidden = [
        'area',
        'image_path',
    ];

    /**
     * Append image_url to every serialized model so the frontend always
     * receives a ready-to-use public URL (or null).
     */
    protected $appends = ['image_url'];

    public function getImageUrlAttribute(): ?string
    {
        return $this->image_path
            ? asset('storage/' . $this->image_path)
            : null;
    }

    public function plants(): HasMany
    {
        return $this->hasMany(Plant::class);
    }

    public function members(): HasMany
    {
        return $this->hasMany(GardenMember::class);
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'garden_members')
            ->withPivot('role')
            ->withTimestamps();
    }
}