// src/components/LoginScreen.jsx
import { useState } from "react";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../firebase";
import { Loader2 } from "lucide-react";

const provider = new GoogleAuthProvider();

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      setError("No se pudo iniciar sesión. Intentá de nuevo.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-8"
      style={{ fontFamily: "'Georgia', serif" }}>

      {/* Logo */}
      <div className="w-24 h-24 rounded-3xl bg-green-50 flex items-center justify-center mb-6 shadow-sm">
        <span className="text-5xl">💰</span>
      </div>

      <h1 className="text-3xl font-black text-gray-800 mb-2 text-center">Mi Billetera</h1>
      <p className="text-gray-400 text-base text-center mb-10 leading-relaxed">
        Llevá el control de tus gastos<br />de forma simple y clara
      </p>

      {/* Botón Google */}
      <button
        onClick={handleLogin}
        disabled={loading}
        className="w-full max-w-xs flex items-center justify-center gap-3
          bg-white border-2 border-gray-200 rounded-2xl px-6 py-4
          shadow-sm active:scale-95 transition-transform
          disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <Loader2 size={24} className="animate-spin text-gray-400" />
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
        )}
        <span className="font-bold text-gray-700 text-lg">
          {loading ? "Entrando..." : "Entrar con Google"}
        </span>
      </button>

      {error && (
        <p className="mt-4 text-red-500 text-sm font-semibold text-center">{error}</p>
      )}

      <p className="mt-8 text-xs text-gray-300 text-center">
        Tus datos son privados y solo vos los ves
      </p>
    </div>
  );
}