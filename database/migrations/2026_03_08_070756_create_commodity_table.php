<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('commodities', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100)->unique();
            $table->timestamps();
        });

        // Seed default commodities from the review document
        $commodities = [
            'Alpukat', 'Anggur', 'Apel', 'Belimbing', 'Bengkuang',
            'Biwa', 'Bidara', 'Buah Naga', 'Buah Negeri/ Bisbul', 'Buah Nona',
            'Buni', 'Cempedak', 'Ceremai', 'Delima', 'Duku',
            'Duwet', 'Gandaria', 'Gowok', 'Jambu air', 'Jambu bol',
            'Jeruk', 'Jeruk besar', 'Kapulasan', 'Kawista', 'Kebemben',
            'Kecapi', 'Kedondong', 'Kemang', 'Kepel', 'Kesemek',
            'Leci', 'Lengkeng', 'Lobi-lobi', 'Mangga', 'Manggis',
            'Markisa', 'Matoa', 'Melon', 'Menteng', 'Mentimun',
            'Mundu', 'Nam-nam', 'Nangka', 'Nenas', 'Pepaya',
            'Pisang', 'Rambai', 'Rambutan', 'Rukam', 'Salak',
            'Sawo', 'Semangka', 'Sirsak', 'Stroberi', 'Sukun',
            'Terong berastagi',
        ];

        foreach ($commodities as $name) {
            DB::table('commodities')->insert([
                'name'       => $name,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('commodities');
    }
};