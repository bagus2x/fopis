<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Class Plant
 *
 * @property int $id
 * @property int $garden_id
 * @property int $submitted_by
 * @property string $plant_code
 * @property string|null $variety
 * @property string|null $block
 * @property string|null $sub_block
 * @property string|null $latitude
 * @property string|null $longitude
 * @property int|null $planting_year
 * @property string|null $propagation_method
 * @property string|null $rootstock
 * @property string|null $seed_origin
 * @property string|null $description
 * @property string|null $status
 * @property \Illuminate\Support\Carbon|null $status_change_date
 * @property string|null $status_change_reason
 * @property string|null $planting_replacement
 * @property string|null $parent_tree_type
 * @property string|null $parent_tree_class
 * @property string|null $registration_number
 * @property string|null $parent_tree_notes
 * @property \Illuminate\Support\Carbon|null $created_at
 * @property \Illuminate\Support\Carbon|null $updated_at
 *
 * @property-read Garden $garden
 * @property-read User $submitter
 */
class Plant extends Model
{
    use HasFactory;

    protected $fillable = [
        'garden_id',
        'submitted_by',
        'plant_code',
        'variety',
        'block',
        'sub_block',
        'latitude',
        'longitude',
        'planting_year',
        'propagation_method',
        'rootstock',
        'seed_origin',
        'description',
        'status',
        'status_change_date',
        'status_change_reason',
        'planting_replacement',
        'parent_tree_type',
        'parent_tree_class',
        'registration_number',
        'parent_tree_notes',
    ];

    protected $casts = [
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        'planting_year' => 'integer',
        'status_change_date' => 'date',
    ];

    public function garden(): BelongsTo
    {
        return $this->belongsTo(Garden::class);
    }

    public function submitter(): BelongsTo
    {
        return $this->belongsTo(User::class, 'submitted_by');
    }
}
