// src/App.jsx
import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import Dashboard from "./components/Dashboard";
import LoginScreen from "./components/LoginScreen";
import { Loader2 } from "lucide-react";

export default function App() {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  // Pantalla de carga inicial
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 size={40} className="text-gray-200 animate-spin" />
      </div>
    );
  }

  // Sin sesión → Login
  if (!user) return <LoginScreen />;

  // Con sesión → Dashboard con datos del usuario
  return <Dashboard user={user} />;
}