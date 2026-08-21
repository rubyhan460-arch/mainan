<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Admin Account (Farhan Admin / God Mode)
        User::updateOrCreate(
            ['email' => 'admin@gmail.com'],
            [
                'name' => 'Farhan (Admin)',
                'password' => Hash::make('admin123'),
                'role' => 'admin',
            ]
        );

        // 2. Standard User Account (Farhan Roleplay)
        User::updateOrCreate(
            ['email' => 'farhan@gmail.com'],
            [
                'name' => 'Farhan',
                'password' => Hash::make('user123'),
                'role' => 'user',
            ]
        );
    }
}
