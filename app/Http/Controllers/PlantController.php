<?php

namespace App\Http\Controllers;

use App\Models\Commodity;
use App\Models\Garden;
use App\Models\Plant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class PlantController extends Controller
{

    public function show(Garden $garden, Plant $plant)
    {
        $this->authorizeGarden($garden);

        abort_if($plant->garden_id != $garden->id, 404);

        $plantData = $plant->load('commodity')->toArray();

        if ($plant->image_path) {
            $plantData['image_url'] = asset('storage/' . $plant->image_path);
        }

        return response()->json($plantData);
    }

    private function authorizeGarden(Garden $garden, array $roles = ['OWNER', 'MANAGER', 'MAINTAINER']): void
    {
        abort_if(
            !$garden->members()
                ->where('user_id', Auth::id())
                ->whereIn('role', $roles)
                ->exists(),
            403
        );
    }

    public function allCoordinates(Garden $garden)
    {
        $this->authorizeGarden($garden);

        $plants = $garden->plants()
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->select('id', 'plant_code', 'variety', 'block', 'status', 'latitude', 'longitude')
            ->get();

        return response()->json($plants);
    }

    /**
     * Return all commodities for use in dropdowns.
     */
    public function commodities()
    {
        return response()->json(
            Commodity::orderBy('name')->get(['id', 'name'])
        );
    }

    /**
     * Generate and return the next plant code for the given garden.
     */
    public function nextCode(Garden $garden)
    {
        $this->authorizeGarden($garden);

        return response()->json([
            'plant_code' => Plant::nextCodeForGarden($garden->id),
        ]);
    }

    public function store(Request $request, Garden $garden)
    {
        $this->authorizeGarden($garden, ['OWNER', 'MANAGER']);

        $validated = $request->validate([
            'plant_code'           => [
                'required',
                'string',
                'max:100',
                // Unique within the same garden
                \Illuminate\Validation\Rule::unique('plants')->where(
                    fn ($q) => $q->where('garden_id', $garden->id)
                ),
            ],
            'commodity_id'         => 'nullable|exists:commodities,id',
            'variety'              => 'nullable|string|max:255',
            'block'                => 'nullable|string|max:100',
            'sub_block'            => 'nullable|string|max:100',
            'latitude'             => 'nullable|numeric|between:-90,90',
            'longitude'            => 'nullable|numeric|between:-180,180',
            'planting_year'        => 'nullable|integer|min:1900|max:' . (date('Y') + 1),
            'propagation_method'   => 'nullable|string|max:255',
            'rootstock'            => 'nullable|string|max:255',
            'seed_origin'          => 'nullable|string|max:255',
            'description'          => 'nullable|string|max:2000',
            'status'               => 'nullable|string|max:100',
            'status_change_date'   => 'nullable|date',
            'status_change_reason' => 'nullable|string|max:500',
            'planting_replacement' => 'nullable|string|max:255',
            'parent_tree_type'     => 'nullable|string|max:255',
            'parent_tree_class'    => 'nullable|string|max:255',
            'registration_number'  => 'nullable|string|max:100',
            'parent_tree_notes'    => 'nullable|string|max:1000',
            'image'                => 'nullable|image|mimes:jpeg,png,jpg,webp|max:5120',
        ]);

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('plants', 'public');
        }

        $garden->plants()->create([
            ...$validated,
            'submitted_by' => Auth::id(),
            'image_path'   => $imagePath,
        ]);

        return redirect()->route('garden.show', $garden)
            ->with('success', 'Plant added successfully.');
    }

    public function update(Request $request, Garden $garden, Plant $plant)
    {
        $this->authorizeGarden($garden, ['OWNER', 'MANAGER']);
        abort_if($plant->garden_id !== $garden->id, 404);

        $validated = $request->validate([
            'plant_code'           => [
                'required',
                'string',
                'max:100',
                // Unique within same garden, ignoring current plant
                \Illuminate\Validation\Rule::unique('plants')
                    ->where(fn ($q) => $q->where('garden_id', $garden->id))
                    ->ignore($plant->id),
            ],
            'commodity_id'         => 'nullable|exists:commodities,id',
            'variety'              => 'nullable|string|max:255',
            'block'                => 'nullable|string|max:100',
            'sub_block'            => 'nullable|string|max:100',
            'latitude'             => 'nullable|numeric|between:-90,90',
            'longitude'            => 'nullable|numeric|between:-180,180',
            'planting_year'        => 'nullable|integer|min:1900|max:' . (date('Y') + 1),
            'propagation_method'   => 'nullable|string|max:255',
            'rootstock'            => 'nullable|string|max:255',
            'seed_origin'          => 'nullable|string|max:255',
            'description'          => 'nullable|string|max:2000',
            'status'               => 'nullable|string|max:100',
            'status_change_date'   => 'nullable|date',
            'status_change_reason' => 'nullable|string|max:500',
            'planting_replacement' => 'nullable|string|max:255',
            'parent_tree_type'     => 'nullable|string|max:255',
            'parent_tree_class'    => 'nullable|string|max:255',
            'registration_number'  => 'nullable|string|max:100',
            'parent_tree_notes'    => 'nullable|string|max:1000',
            'image'                => 'nullable|image|mimes:jpeg,png,jpg,webp|max:5120',
            'remove_image'         => 'nullable|boolean',
        ]);

        $imagePath = $plant->image_path;

        if ($request->boolean('remove_image') && $imagePath) {
            Storage::disk('public')->delete($imagePath);
            $imagePath = null;
        }

        if ($request->hasFile('image')) {
            if ($imagePath) Storage::disk('public')->delete($imagePath);
            $imagePath = $request->file('image')->store('plants', 'public');
        }

        $plant->update([...$validated, 'image_path' => $imagePath]);

        return redirect()->route('garden.show', $garden)
            ->with('success', 'Plant updated successfully.');
    }

    public function destroy(Garden $garden, Plant $plant)
    {
        $this->authorizeGarden($garden, ['OWNER', 'MANAGER']);
        abort_if($plant->garden_id !== $garden->id, 404);

        if ($plant->image_path) {
            Storage::disk('public')->delete($plant->image_path);
        }

        $plant->delete();

        return redirect()->route('garden.show', $garden)
            ->with('success', 'Plant deleted.');
    }
}