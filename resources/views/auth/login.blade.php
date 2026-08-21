<!DOCTYPE html>
<html lang="id">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Masuk - Chatbot Mainan Farhan</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        :root {
            --bg-base: #0a0510;
            --card-bg: rgba(22, 10, 32, 0.75);
            --primary: #ff0055;
            --primary-glow: rgba(255, 0, 85, 0.4);
            --accent: #00f5d4;
            --accent-glow: rgba(0, 245, 212, 0.3);
            --text-main: #ffffff;
            --text-muted: #bc93aa;
            --border-glass: rgba(255, 255, 255, 0.12);
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: 'Plus Jakarta Sans', sans-serif;
        }

        body {
            background-color: var(--bg-base);
            background-image: 
                radial-gradient(circle at 15% 20%, rgba(255, 0, 85, 0.18) 0%, transparent 40%),
                radial-gradient(circle at 85% 80%, rgba(0, 245, 212, 0.12) 0%, transparent 40%),
                radial-gradient(circle at 50% 50%, rgba(123, 44, 191, 0.15) 0%, transparent 60%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--text-main);
            padding: 20px;
        }

        .auth-container {
            width: 100%;
            max-width: 440px;
            background: var(--card-bg);
            backdrop-filter: blur(20px);
            border: 1px solid var(--border-glass);
            border-radius: 20px;
            padding: 36px 32px;
            box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px var(--primary-glow);
            position: relative;
            overflow: hidden;
        }

        .auth-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #ff0055, #7b2cbf, #00f5d4);
        }

        .auth-brand {
            text-align: center;
            margin-bottom: 28px;
        }

        .brand-logo {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 56px;
            height: 56px;
            border-radius: 16px;
            background: linear-gradient(135deg, #ff0055, #7b2cbf);
            color: #fff;
            font-size: 26px;
            margin-bottom: 12px;
            box-shadow: 0 0 20px var(--primary-glow);
        }

        .brand-title {
            font-family: 'Outfit', sans-serif;
            font-size: 24px;
            font-weight: 800;
            background: linear-gradient(135deg, #fff 40%, #ff8fab 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            letter-spacing: -0.5px;
        }

        .brand-subtitle {
            font-size: 13px;
            color: var(--text-muted);
            margin-top: 4px;
        }

        .form-group {
            margin-bottom: 18px;
        }

        .form-label {
            display: block;
            font-size: 13px;
            font-weight: 600;
            color: #e2d1db;
            margin-bottom: 6px;
        }

        .input-box {
            width: 100%;
            padding: 12px 14px;
            background: rgba(0, 0, 0, 0.35);
            border: 1px solid rgba(255, 255, 255, 0.15);
            border-radius: 10px;
            color: #fff;
            font-size: 14px;
            transition: all 0.2s ease;
            outline: none;
        }

        .input-box:focus {
            border-color: #ff0055;
            box-shadow: 0 0 12px var(--primary-glow);
            background: rgba(0, 0, 0, 0.5);
        }

        .btn-submit {
            width: 100%;
            padding: 13px;
            border-radius: 10px;
            border: none;
            background: linear-gradient(135deg, #ff0055, #e0004d);
            color: #fff;
            font-size: 15px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s ease;
            box-shadow: 0 6px 20px var(--primary-glow);
            margin-top: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        }

        .btn-submit:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(255, 0, 85, 0.6);
        }

        .alert-error {
            background: rgba(255, 0, 85, 0.15);
            border: 1px solid rgba(255, 0, 85, 0.4);
            color: #ff8fab;
            padding: 10px 14px;
            border-radius: 8px;
            font-size: 13px;
            margin-bottom: 18px;
        }

        .auth-footer {
            text-align: center;
            margin-top: 24px;
            font-size: 13px;
            color: var(--text-muted);
        }

        .auth-link {
            color: var(--accent);
            text-decoration: none;
            font-weight: 600;
        }

        .auth-link:hover {
            text-decoration: underline;
        }

        .demo-hint {
            margin-top: 20px;
            padding: 10px;
            background: rgba(255, 255, 255, 0.04);
            border-radius: 8px;
            font-size: 11px;
            color: #a78297;
            text-align: center;
            border: 1px dashed rgba(255, 255, 255, 0.1);
        }
    </style>
</head>

<body>
    <div class="auth-container">
        <div class="auth-brand">
            <div class="brand-logo">
                <i class="fa-solid fa-fire-flame-curved"></i>
            </div>
            <h1 class="brand-title">Chatbot Mainan Farhan</h1>
            <p class="brand-subtitle">Laravel 13 Uncensored AI Roleplay Engine</p>
        </div>

        @if($errors->any())
        <div class="alert-error">
            <i class="fa-solid fa-circle-exclamation"></i> {{ $errors->first() }}
        </div>
        @endif

        <form action="{{ url('/login') }}" method="POST">
            @csrf
            <div class="form-group">
                <label class="form-label">Username Akun:</label>
                <input type="text" name="username" class="input-box" placeholder="Contoh: Farhan (Admin) atau Farhan" value="{{ old('username') }}" required autofocus autocomplete="username">
            </div>

            <div class="form-group">
                <label class="form-label">Password:</label>
                <input type="password" name="password" class="input-box" placeholder="••••••••" required autocomplete="current-password">
            </div>

            <button type="submit" class="btn-submit">
                <i class="fa-solid fa-right-to-bracket"></i> Masuk Sekarang
            </button>
        </form>

        <div class="demo-hint">
            💡 <strong>Akun Bawaan:</strong> Login sebagai <code>Farhan (Admin)</code> atau <code>Farhan</code> (password: <code>password</code>).
        </div>

        <div class="auth-footer">
            Belum punya akun khusus karakter? <a href="{{ url('/register') }}" class="auth-link">Daftar Akun Baru</a>
        </div>
    </div>
</body>

</html>
