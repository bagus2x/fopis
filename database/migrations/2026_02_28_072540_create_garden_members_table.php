<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('garden_members', function (Blueprint $table) {
            $table->id();

            $table->foreignId('garden_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->string('role'); // OWNER | MANAGER

            $table->timestamps();

            $table->unique(['garden_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('garden_members');
    }
};
