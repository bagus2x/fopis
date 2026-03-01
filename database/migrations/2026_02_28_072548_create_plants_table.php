<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('plants', function (Blueprint $table) {
            $table->id();

            $table->foreignId('garden_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('submitted_by')
                ->constrained('users')
                ->restrictOnDelete();

            $table->string('plant_code');

            $table->string('variety')->nullable();
            $table->string('block')->nullable();
            $table->string('sub_block')->nullable();

            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();

            $table->integer('planting_year')->nullable();
            $table->string('propagation_method')->nullable();
            $table->string('rootstock')->nullable();
            $table->string('seed_origin')->nullable();
            $table->text('description')->nullable();

            $table->string('status')->nullable();
            $table->date('status_change_date')->nullable();
            $table->string('status_change_reason')->nullable();
            $table->string('planting_replacement')->nullable();

            $table->string('parent_tree_type')->nullable();
            $table->string('parent_tree_class')->nullable();
            $table->string('registration_number')->nullable();
            $table->text('parent_tree_notes')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plants');
    }
};
