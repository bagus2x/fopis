<?php

namespace App\Http\Controllers;

use App\Models\Garden;
use App\Models\GardenMember;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class GardenController extends Controller
{
    public function index(Request $request): Response
    {
        $search  = $request->input('search');
        $perPage = (int) $request->input('per_page', 12);
        $perPage = in_array($perPage, [10, 12, 25, 50, 100]) ? $perPage : 12;

        $gardens = Garden::with(['members.user'])
            ->whereHas('members', fn($q) => $q->where('user_id', Auth::user()->id))
            ->withCount('plants')
            ->when(
                $search,
                fn($q) =>
                $q->where(
                    fn($q) =>
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('location', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                )
            )
            ->latest()
            ->paginate($perPage)
            ->withQueryString();   // keeps ?search=… in pagination links

        return Inertia::render('garden/index', [
            'gardens' => $gardens,
            'filters' => [
                'search'   => $search,
                'per_page' => $perPage,
            ],
        ]);
    }

    public function create(): Response
    {
        $users = User::where('id', '!=', Auth::user()->id)
            ->select('id', 'name', 'email')
            ->orderBy('name')
            ->get();

        return Inertia::render('garden/create', [
            'users' => $users,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'              => 'required|string|max:255',
            'description'       => 'nullable|string|max:2000',
            'location'          => 'nullable|string|max:500',
            'area_hectares'     => 'nullable|numeric|min:0',
            'area'              => 'nullable|string',  // sent as JSON string in multipart
            'members'           => 'nullable|string',  // JSON string in multipart
            'image'             => 'nullable|image|mimes:jpeg,png,jpg,webp|max:5120', // 5 MB
        ]);

        // Decode JSON fields (Inertia sends them as strings when forceFormData is used)
        $areaJson    = isset($validated['area'])    ? json_decode($validated['area'],    true) : null;
        $membersJson = isset($validated['members']) ? json_decode($validated['members'], true) : [];

        // Handle image upload
        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('gardens', 'public');
        }

        // Insert garden with GEOMETRY handled via raw query
        $garden = $this->createGarden([
            'name'          => $validated['name'],
            'description'   => $validated['description'] ?? null,
            'location'      => $validated['location'] ?? null,
            'area_hectares' => $validated['area_hectares'] ?? null,
            'area'          => $areaJson,
            'image_path'    => $imagePath,
        ]);

        GardenMember::create([
            'garden_id' => $garden->id,
            'user_id'   => Auth::user()->id,
            'role'      => GardenMember::ROLE_OWNER,
        ]);

        foreach ($membersJson as $member) {
            if (!isset($member['user_id'], $member['role'])) continue;
            if (!in_array($member['role'], ['MANAGER', 'VIEWER'])) continue;

            GardenMember::create([
                'garden_id' => $garden->id,
                'user_id'   => $member['user_id'],
                'role'      => $member['role'],
            ]);
        }

        return redirect()->route('garden.index')
            ->with('success', 'Garden created successfully.');
    }

    public function show(Request $request, Garden $garden): Response
    {
        $this->authorizeGarden($garden);

        $search  = $request->input('search');
        $perPage = (int) $request->input('per_page', 50);
        $perPage = in_array($perPage, [25, 50, 100, 200]) ? $perPage : 50;

        $plants = $garden->plants()
            ->when(
                $search,
                fn($q) =>
                $q->where(
                    fn($inner) =>
                    $inner->where('plant_code', 'like', "%{$search}%")
                        ->orWhere('variety', 'like', "%{$search}%")
                        ->orWhere('block', 'like', "%{$search}%")
                        ->orWhere('status', 'like', "%{$search}%")
                )
            )
            ->latest()
            ->paginate($perPage)
            ->withQueryString();

        $garden->load('members.user');

        return Inertia::render('garden/show', [
            'garden'  => $this->appendGeoJson($garden),
            'plants'  => $plants,
            'filters' => [
                'search'   => $search,
                'per_page' => $perPage,
            ],
        ]);
    }

    public function edit(Garden $garden): Response
    {
        $this->authorizeGarden($garden, ['OWNER', 'MANAGER']);

        $users = User::where('id', '!=', Auth::user()->id)
            ->select('id', 'name', 'email')
            ->orderBy('name')
            ->get();

        $garden->load('members.user');

        return Inertia::render('garden/edit', [
            'garden' => $this->appendGeoJson($garden),
            'users'  => $users,
        ]);
    }

    public function update(Request $request, Garden $garden)
    {
        $this->authorizeGarden($garden, ['OWNER', 'MANAGER']);

        $validated = $request->validate([
            'name'          => 'required|string|max:255',
            'description'   => 'nullable|string|max:2000',
            'location'      => 'nullable|string|max:500',
            'area_hectares' => 'nullable|numeric|min:0',
            'area'          => 'nullable|string',
            'members'       => 'nullable|string',
            'image'         => 'nullable|image|mimes:jpeg,png,jpg,webp|max:5120',
            'remove_image'  => 'nullable|boolean',
        ]);

        $areaJson    = isset($validated['area'])    ? json_decode($validated['area'],    true) : null;
        $membersJson = isset($validated['members']) ? json_decode($validated['members'], true) : [];

        // Handle image
        $imagePath = $garden->image_path;

        if ($request->boolean('remove_image') && $imagePath) {
            Storage::disk('public')->delete($imagePath);
            $imagePath = null;
        }

        if ($request->hasFile('image')) {
            if ($imagePath) Storage::disk('public')->delete($imagePath);
            $imagePath = $request->file('image')->store('gardens', 'public');
        }

        $this->updateGarden($garden, [
            'name'          => $validated['name'],
            'description'   => $validated['description'] ?? null,
            'location'      => $validated['location'] ?? null,
            'area_hectares' => $validated['area_hectares'] ?? null,
            'area'          => $areaJson,
            'image_path'    => $imagePath,
        ]);

        $garden->members()->where('role', '!=', GardenMember::ROLE_OWNER)->delete();

        foreach ($membersJson as $member) {
            if (!isset($member['user_id'], $member['role'])) continue;
            if (!in_array($member['role'], ['MANAGER', 'VIEWER'])) continue;

            GardenMember::create([
                'garden_id' => $garden->id,
                'user_id'   => $member['user_id'],
                'role'      => $member['role'],
            ]);
        }

        return redirect()->route('garden.index')
            ->with('success', 'Garden updated successfully.');
    }

    public function destroy(Garden $garden)
    {
        $this->authorizeGarden($garden, ['OWNER']);

        if ($garden->image_path) {
            Storage::disk('public')->delete($garden->image_path);
        }

        $garden->delete();

        return redirect()->route('garden.index')
            ->with('success', 'Garden deleted.');
    }

    /* ─────────────────────────────────────────
       Private helpers
    ───────────────────────────────────────── */

    private function createGarden(array $data): Garden
    {
        $now = now();

        if (!empty($data['area'])) {
            $geoJson = json_encode($data['area']);

            DB::statement("
                INSERT INTO gardens (name, description, location, area_hectares, area, image_path, created_at, updated_at)
                VALUES (?, ?, ?, ?, ST_GeomFromGeoJSON(?), ?, ?, ?)
            ", [
                $data['name'],
                $data['description'],
                $data['location'],
                $data['area_hectares'],
                $geoJson,
                $data['image_path'],
                $now,
                $now,
            ]);

            return Garden::latest('id')->first();
        }

        return Garden::create([
            'name'          => $data['name'],
            'description'   => $data['description'],
            'location'      => $data['location'],
            'area_hectares' => $data['area_hectares'],
            'image_path'    => $data['image_path'],
        ]);
    }

    private function updateGarden(Garden $garden, array $data): void
    {
        $now = now();

        if (!empty($data['area'])) {
            $geoJson = json_encode($data['area']);

            DB::statement("
                UPDATE gardens
                SET name = ?, description = ?, location = ?, area_hectares = ?,
                    area = ST_GeomFromGeoJSON(?), image_path = ?, updated_at = ?
                WHERE id = ?
            ", [
                $data['name'],
                $data['description'],
                $data['location'],
                $data['area_hectares'],
                $geoJson,
                $data['image_path'],
                $now,
                $garden->id,
            ]);

            $garden->refresh();
            return;
        }

        $garden->update([
            'name'          => $data['name'],
            'description'   => $data['description'],
            'location'      => $data['location'],
            'area_hectares' => $data['area_hectares'],
            'image_path'    => $data['image_path'],
            'area'          => null,
        ]);
    }

    /**
     * Re-attach area as GeoJSON and image as public URL.
     */
    private function appendGeoJson(Garden $garden): array
    {
        $data = $garden->toArray();

        $row = DB::selectOne(
            'SELECT ST_AsGeoJSON(area) as area_geojson FROM gardens WHERE id = ?',
            [$garden->id]
        );

        $data['area']      = $row?->area_geojson ? json_decode($row->area_geojson, true) : null;
        $data['image_url'] = $garden->image_path
            ? asset('storage/' . $garden->image_path)
            : null;

        return $data;
    }

    private function authorizeGarden(Garden $garden, array $roles = ['OWNER', 'MANAGER', 'VIEWER']): void
    {
        abort_if(
            !$garden->members()
                ->where('user_id', Auth::user()->id)
                ->whereIn('role', $roles)
                ->exists(),
            403
        );
    }
}
