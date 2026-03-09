<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('plants', function (Blueprint $table) {
            $table->foreignId('commodity_id')
                ->nullable()
                ->after('plant_code')
                ->constrained('commodities')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('plants', function (Blueprint $table) {
            $table->dropForeign(['commodity_id']);
            $table->dropColumn('commodity_id');
        });
    }
};