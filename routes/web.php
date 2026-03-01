<?php

use Illuminate\Support\Facades\Route;
use Laravel\Fortify\Features;
use App\Http\Controllers\GardenController;

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
});

require __DIR__.'/settings.php';