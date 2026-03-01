<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('gardens', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('description');
            $table->string('location')->nullable();
            $table->decimal('area_hectares', 10, 2)->nullable();
            $table->geometry('area');
            $table->string('image_path')->nullable();
            $table->timestamps();

            $table->spatialIndex('area');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gardens');
    }
};
