<?php

use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;
use App\Http\Controllers\GardenController;
use App\Http\Controllers\PlantController;

Route::inertia('/', 'welcome', [
    'canRegister' => Features::enabled(Features::registration()),
])->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    Route::get('gardens', [GardenController::class, 'index'])->name('garden.index');
    Route::get('gardens/create', [GardenController::class, 'create'])->name('garden.create');
    Route::post('gardens', [GardenController::class, 'store'])->name('garden.store');
    Route::get('gardens/{garden}', [GardenController::class, 'show'])->name('garden.show');
    Route::get('gardens/{garden}/edit', [GardenController::class, 'edit'])->name('garden.edit');
    Route::put('gardens/{garden}', [GardenController::class, 'update'])->name('garden.update');
    Route::delete('gardens/{garden}', [GardenController::class, 'destroy'])->name('garden.destroy');

    Route::get('gardens/{garden}/plants/coordinates', [PlantController::class, 'allCoordinates'])
        ->name('garden.plants.coordinates');
    Route::post('gardens/{garden}/plants', [PlantController::class, 'store'])
        ->name('garden.plants.store');
    Route::put('gardens/{garden}/plants/{plant}', [PlantController::class, 'update'])
        ->name('garden.plant.update');
    Route::delete('gardens/{garden}/plants/{plant}', [PlantController::class, 'destroy'])
        ->name('garden.plant.destroy');
    Route::get('/gardens/{garden}/plants/{plant}', [PlantController::class, 'show'])->name('plants.show');
});

require __DIR__ . '/settings.php';
