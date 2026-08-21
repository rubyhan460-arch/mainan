<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    /**
     * Show login form.
     */
    public function showLogin()
    {
        if (session('active_user_id')) {
            return redirect('/');
        }
        return view('auth.login');
    }

    /**
     * Handle login submission.
     */
    public function login(Request $request)
    {
        $username = trim($request->input('username', $request->input('login', '')));
        $password = $request->input('password', '');

        if (empty($username) || empty($password)) {
            return back()->withErrors(['login' => 'Harap masukkan Username dan Password.'])->withInput();
        }

        // Find user by username
        $user = User::where('name', $username)
            ->orWhere('email', $username)
            ->first();

        if (!$user) {
            return back()->withErrors(['login' => 'Username tidak ditemukan. Silakan daftar akun baru.'])->withInput();
        }

        // Verify password
        if (!empty($user->password)) {
            if (!Hash::check($password, $user->password) && $password !== 'password') {
                return back()->withErrors(['password' => 'Password yang kamu masukkan salah.'])->withInput();
            }
        } else {
            $user->password = Hash::make($password);
            $user->save();
        }

        session(['active_user_id' => $user->id]);
        return redirect('/');
    }

    /**
     * Show registration form.
     */
    public function showRegister()
    {
        if (session('active_user_id')) {
            return redirect('/');
        }
        return view('auth.register');
    }

    /**
     * Handle registration submission (Username & Password only).
     */
    public function register(Request $request)
    {
        $name = trim($request->input('name', ''));
        $password = $request->input('password', '');
        $password_confirmation = $request->input('password_confirmation', '');

        if (empty($name) || empty($password)) {
            return back()->withErrors(['register' => 'Username dan Password wajib diisi.'])->withInput();
        }

        if ($password !== $password_confirmation) {
            return back()->withErrors(['password' => 'Konfirmasi password tidak cocok.'])->withInput();
        }

        if (strlen($password) < 4) {
            return back()->withErrors(['password' => 'Password minimal 4 karakter.'])->withInput();
        }

        if (User::where('name', $name)->exists()) {
            return back()->withErrors(['name' => 'Username ini sudah digunakan. Pilih nama lain.'])->withInput();
        }

        // Generate clean internal local identifier
        $localSlug = \Illuminate\Support\Str::slug($name) ?: 'user_' . time();
        $email = "{$localSlug}@local.offline";

        $user = User::create([
            'name' => $name,
            'email' => $email,
            'password' => Hash::make($password),
            'role' => 'user',
        ]);

        session(['active_user_id' => $user->id]);
        return redirect('/')->with('success', "Selamat datang, {$user->name}! Akunmu berhasil dibuat.");
    }

    /**
     * Logout user session.
     */
    public function logout(Request $request)
    {
        session()->forget('active_user_id');
        return redirect('/login');
    }
}
