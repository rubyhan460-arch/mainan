<?php

use App\Http\Controllers\Admin\CharacterStudioController;
use App\Http\Controllers\Admin\UserManagementController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\ProfileController;
use Illuminate\Support\Facades\Route;

// Authentication Routes
Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
Route::post('/login', [AuthController::class, 'login']);
Route::get('/register', [AuthController::class, 'showRegister'])->name('register');
Route::post('/register', [AuthController::class, 'register']);
Route::match(['get', 'post'], '/logout', [AuthController::class, 'logout'])->name('logout');

// Main Web Application Route
Route::get('/', [ChatController::class, 'index'])->name('home');

// API & AJAX Endpoints for Chat Application
Route::prefix('api')->group(function () {
    Route::get('/characters', [ChatController::class, 'getCharacters']);
    Route::post('/chat', [ChatController::class, 'chat']);
    Route::get('/history/{char_id}', [ChatController::class, 'getHistory']);
    Route::post('/clear/{char_id}', [ChatController::class, 'clearHistory']);
    Route::match(['get', 'post'], '/affinity/{char_id}', [ChatController::class, 'manageAffinity']);
    Route::post('/search_character_image', [ChatController::class, 'searchImage']);
    Route::get('/facts', [ChatController::class, 'getFacts']);
    Route::get('/proxy-image', [ChatController::class, 'proxyImage']);
    Route::match(['get', 'post'], '/settings', [ChatController::class, 'manageSettings']);
    Route::match(['get', 'post'], '/key', [ChatController::class, 'manageSettings']);

    // Profile Switcher Routes
    Route::post('/profile/switch', [ProfileController::class, 'switch']);
    Route::post('/profile/create', [ProfileController::class, 'createProfile']);

    // Admin Character Studio CRUD Routes
    Route::get('/admin/dataset-photos', [ChatController::class, 'getDatasetPhotos']);
    Route::post('/admin/characters', [CharacterStudioController::class, 'store']);
    Route::put('/admin/characters/{id}', [CharacterStudioController::class, 'update']);
    Route::delete('/admin/characters/{id}', [CharacterStudioController::class, 'destroy']);

    // Admin User & Affinity Management Routes
    Route::get('/admin/users', [UserManagementController::class, 'index']);
    Route::get('/admin/users/{userId}/affinities', [UserManagementController::class, 'getUserAffinities']);
    Route::post('/admin/users/{userId}/affinity', [UserManagementController::class, 'updateUserAffinity']);
    Route::post('/admin/users/{userId}/credentials', [UserManagementController::class, 'updateUserCredentials']);
    Route::delete('/admin/users/{userId}', [UserManagementController::class, 'destroy']);
});
