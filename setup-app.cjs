#!/usr/bin/env node

/**
 * setup-app.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Scaffolding automático para "Mi Billetera" — app de finanzas personales
 * pensada para adultos mayores (alta legibilidad, sin menús ocultos).
 *
 * Stack: React + Vite · Tailwind CSS · Recharts · Firebase · lucide-react
 *
 * Uso:
 *   node setup-app.js
 * ─────────────────────────────────────────────────────────────────────────────
 */

const fs   = require("fs");
const path = require("path");

// ─── Paleta y helpers ─────────────────────────────────────────────────────────

const RESET  = "\x1b[0m";
const GREEN  = "\x1b[32m";
const CYAN   = "\x1b[36m";
const YELLOW = "\x1b[33m";
const RED    = "\x1b[31m";
const BOLD   = "\x1b[1m";

const log  = (msg)       => console.log(`${GREEN}✔${RESET}  ${msg}`);
const info = (msg)       => console.log(`${CYAN}ℹ${RESET}  ${msg}`);
const warn = (msg)       => console.log(`${YELLOW}⚠${RESET}  ${msg}`);
const err  = (msg)       => console.log(`${RED}✖${RESET}  ${msg}`);
const head = (msg)       => console.log(`\n${BOLD}${CYAN}── ${msg} ──${RESET}\n`);

function writeFile(filePath, content) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
  log(`Creado: ${filePath}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTENIDO DE ARCHIVOS
// ─────────────────────────────────────────────────────────────────────────────

const files = {};

// ─── .env.local ──────────────────────────────────────────────────────────────
files[".env.local"] = `# ─────────────────────────────────────────────────────
# Firebase — pegá tus claves desde la Consola de Firebase
# Proyecto → Configuración → Tus apps → SDK config (ESM)
# ─────────────────────────────────────────────────────
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
`;

// ─── src/firebase.js ─────────────────────────────────────────────────────────
files["src/firebase.js"] = `// src/firebase.js
import { initializeApp }  from "firebase/app";
import { getFirestore }   from "firebase/firestore";

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
`;

// ─── src/hooks/useExpenses.js ─────────────────────────────────────────────────
files["src/hooks/useExpenses.js"] = `// src/hooks/useExpenses.js
import { useState, useEffect, useCallback } from "react";
import {
  collection, addDoc, deleteDoc, doc,
  onSnapshot, query, orderBy,
  serverTimestamp, where, Timestamp,
} from "firebase/firestore";
import { db } from "../firebase";

const COLLECTION = "expenses";

function monthRange() {
  const now   = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return { start: Timestamp.fromDate(start), end: Timestamp.fromDate(end) };
}

export function useExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    const { start, end } = monthRange();
    const q = query(
      collection(db, COLLECTION),
      orderBy("createdAt", "desc"),
      where("createdAt", ">=", start),
      where("createdAt", "<=", end),
    );

    const unsub = onSnapshot(q,
      (snap) => {
        setExpenses(
          snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
            date: d.data().createdAt?.toDate().toISOString() ?? new Date().toISOString(),
          }))
        );
        setLoading(false);
      },
      (e) => { setError(e.message); setLoading(false); }
    );
    return unsub;
  }, []);

  const addExpense = useCallback(async ({ category, amount }) => {
    if (!category || !(amount > 0)) throw new Error("Datos inválidos");
    await addDoc(collection(db, COLLECTION), {
      category,
      amount: Number(amount),
      createdAt: serverTimestamp(),
    });
  }, []);

  const deleteExpense = useCallback(async (id) => {
    await deleteDoc(doc(db, COLLECTION, id));
  }, []);

  const totalsByCategory = expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] ?? 0) + e.amount;
    return acc;
  }, {});

  const grandTotal = Object.values(totalsByCategory).reduce((s, v) => s + v, 0);

  return { expenses, loading, error, addExpense, deleteExpense, totalsByCategory, grandTotal };
}
`;

// ─── src/components/NumericKeyboard.jsx ──────────────────────────────────────
files["src/components/NumericKeyboard.jsx"] = `// src/components/NumericKeyboard.jsx
import { useState, useEffect, useCallback } from "react";
import { Delete, CheckCircle2, X } from "lucide-react";

export default function NumericKeyboard({ category, onConfirm, onClose }) {
  const [value, setValue] = useState("");

  // Soporte teclado físico
  useEffect(() => {
    const h = (e) => {
      if (e.key >= "0" && e.key <= "9") push(e.key);
      else if (e.key === "Backspace")    pop();
      else if (e.key === "Enter")        confirm();
      else if (e.key === "Escape")       onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  });

  const push    = useCallback((d) => setValue((p) => p.length >= 8 ? p : p === "0" ? d : p + d), []);
  const pop     = useCallback(()  => setValue((p) => p.slice(0, -1)), []);
  const clear   = useCallback(()  => setValue(""), []);
  const confirm = useCallback(()  => { if (+value > 0) onConfirm(+value); }, [value, onConfirm]);

  const display    = value || "0";
  const canConfirm = +value > 0;

  const fmtARS = (n) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

  const rows = [["7","8","9"],["4","5","6"],["1","2","3"],["C","0","⌫"]];

  return (
    <div
      role="dialog" aria-modal="true"
      aria-label={\`Ingresar monto para \${category.label}\`}
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(15,10,5,0.6)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="w-full max-w-sm rounded-t-3xl pb-10 pt-6 px-5 bg-amber-50"
        style={{ boxShadow: \`0 -10px 50px \${category.color}55\` }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <span
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
              style={{ background: category.color + "22" }}
            >{category.icon}</span>
            <div>
              <p className="text-xs font-bold tracking-widest text-amber-500 uppercase">Gasto en</p>
              <p className="text-2xl font-bold text-stone-800">{category.label}</p>
            </div>
          </div>
          <button
            onClick={onClose} aria-label="Cancelar"
            className="w-12 h-12 rounded-full bg-stone-200 flex items-center justify-center active:scale-90 transition-transform"
          >
            <X size={22} className="text-stone-600" />
          </button>
        </div>

        {/* Display */}
        <div
          className="w-full rounded-2xl px-5 py-4 mb-5 flex items-center justify-between bg-white border-2 transition-colors"
          style={{ borderColor: canConfirm ? category.color : "#e5e7eb" }}
        >
          <span className="text-3xl font-semibold text-amber-400">$</span>
          <span className="text-5xl font-bold text-stone-800 tracking-tight" aria-live="polite">
            {display}
          </span>
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {rows.flat().map((k) => (
            <button
              key={k}
              onClick={() => k === "C" ? clear() : k === "⌫" ? pop() : push(k)}
              aria-label={k === "⌫" ? "Borrar" : k === "C" ? "Limpiar" : k}
              className={\`
                h-16 rounded-2xl font-bold text-3xl flex items-center justify-center
                select-none active:scale-90 transition-transform duration-75
                focus-visible:ring-4 focus-visible:ring-amber-400 outline-none
                \${k === "C" || k === "⌫"
                  ? "bg-stone-200 text-stone-600"
                  : "bg-white text-stone-800 shadow-sm border border-stone-100"
                }
              \`}
            >
              {k === "⌫" ? <Delete size={26} /> : k}
            </button>
          ))}
        </div>

        {/* Confirm */}
        <button
          onClick={confirm} disabled={!canConfirm}
          aria-label="Confirmar gasto"
          className="w-full h-16 rounded-2xl text-xl font-bold text-white flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-40"
          style={{ background: canConfirm ? category.color : "#9ca3af", boxShadow: canConfirm ? \`0 6px 24px \${category.color}66\` : "none" }}
        >
          <CheckCircle2 size={26} />
          Guardar {canConfirm ? fmtARS(+value) : ""}
        </button>
      </div>
    </div>
  );
}
`;

// ─── src/components/Dashboard.jsx ────────────────────────────────────────────
files["src/components/Dashboard.jsx"] = `// src/components/Dashboard.jsx
import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import {
  UtensilsCrossed, Heart, Zap, Home, Bus,
  ShoppingBag, Loader2,
} from "lucide-react";
import NumericKeyboard from "./NumericKeyboard";
import { useExpenses } from "../hooks/useExpenses";

// ─── Categorías ───────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "food",      label: "Comida",     Icon: UtensilsCrossed, color: "#E07B54" },
  { id: "health",    label: "Salud",      Icon: Heart,           color: "#5BA08A" },
  { id: "services",  label: "Servicios",  Icon: Zap,             color: "#D4A843" },
  { id: "home",      label: "Hogar",      Icon: Home,            color: "#7B8FD4" },
  { id: "transport", label: "Transporte", Icon: Bus,             color: "#C47BC4" },
  { id: "other",     label: "Otros",      Icon: ShoppingBag,     color: "#9CA3AF" },
];

const EMPTY_SLICE = [{ id: "_empty", value: 1, color: "#F5EFE6" }];

const fmtARS = (n) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

// ─── Tooltip personalizado ───────────────────────────────────────────────────
function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  if (d.id === "_empty") return null;
  return (
    <div className="bg-white rounded-xl px-4 py-2 shadow-lg border border-stone-100">
      <p className="font-bold text-stone-800 text-lg">{d.label}</p>
      <p className="font-semibold text-stone-500">{fmtARS(d.value)}</p>
    </div>
  );
}

// ─── Etiqueta central ────────────────────────────────────────────────────────
function DonutLabel({ total }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
      <span className="text-xs font-bold tracking-[0.2em] text-amber-500 uppercase">Este mes</span>
      <span className="text-4xl font-bold text-stone-800 mt-1 leading-none">{fmtARS(total)}</span>
      <span className="text-sm text-stone-400 mt-1 font-medium">en gastos</span>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { totalsByCategory, grandTotal, addExpense, loading } = useExpenses();
  const [activeCat, setActiveCat] = useState(null);
  const [toast,     setToast]     = useState(null);

  const chartData = CATEGORIES
    .filter((c) => (totalsByCategory[c.id] ?? 0) > 0)
    .map((c)    => ({ ...c, value: totalsByCategory[c.id] }));

  const handleConfirm = async (amount) => {
    await addExpense({ category: activeCat.id, amount });
    setToast(\`\${activeCat.Icon ? "" : ""}\${activeCat.label}: \${fmtARS(amount)}\`);
    setActiveCat(null);
    setTimeout(() => setToast(null), 2500);
  };

  return (
    <div className="min-h-screen bg-amber-50 flex flex-col" style={{ fontFamily: "'Georgia', 'Times New Roman', serif" }}>

      {/* ── Header ── */}
      <header className="flex items-center justify-between px-6 pt-10 pb-3">
        <div>
          <h1 className="text-3xl font-bold text-stone-800 leading-none">Mi Billetera</h1>
          <p className="text-base text-stone-400 mt-1 capitalize">
            {new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })}
          </p>
        </div>
        {loading && <Loader2 size={28} className="text-amber-400 animate-spin" />}
      </header>

      {/* ── Gráfico de Dona ── */}
      <section className="flex flex-col items-center px-4 mt-2">
        <div className="relative w-72 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData.length ? chartData : EMPTY_SLICE}
                cx="50%" cy="50%"
                innerRadius="58%" outerRadius="82%"
                paddingAngle={chartData.length > 1 ? 4 : 0}
                dataKey="value"
                strokeWidth={0}
                animationBegin={0}
                animationDuration={500}
              >
                {(chartData.length ? chartData : EMPTY_SLICE).map((e) => (
                  <Cell key={e.id} fill={e.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <DonutLabel total={grandTotal} />
        </div>

        {/* Leyenda */}
        {chartData.length > 0 && (
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-3 px-4">
            {chartData.map((d) => (
              <div key={d.id} className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full" style={{ background: d.color }} />
                <span className="text-sm font-semibold text-stone-600">{d.label}</span>
                <span className="text-sm font-bold text-stone-800">{fmtARS(d.value)}</span>
              </div>
            ))}
          </div>
        )}

        {chartData.length === 0 && (
          <p className="text-stone-400 text-base text-center mt-2 max-w-xs">
            Tocá una categoría abajo para registrar tu primer gasto del mes
          </p>
        )}
      </section>

      {/* ── Separador ── */}
      <div className="mx-6 my-5 border-t-2 border-amber-100" />

      {/* ── Categorías ── */}
      <section className="px-4 pb-12">
        <h2 className="text-center text-xs font-bold tracking-[0.25em] text-amber-500 uppercase mb-5">
          ¿Qué gastaste?
        </h2>
        <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
          {CATEGORIES.map(({ id, label, Icon, color }) => {
            const total = totalsByCategory[id] ?? 0;
            return (
              <button
                key={id}
                onClick={() => setActiveCat({ id, label, Icon, color, icon: null })}
                aria-label={\`Registrar gasto en \${label}\`}
                className="
                  flex flex-col items-center justify-center gap-2
                  rounded-3xl py-5 px-3 bg-white
                  border-2 active:scale-95 transition-transform duration-100
                  focus-visible:ring-4 focus-visible:ring-amber-400 outline-none
                "
                style={{
                  borderColor: total > 0 ? color : "transparent",
                  boxShadow: \`0 4px 18px \${color}28\`,
                }}
              >
                <span
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: color + "18" }}
                >
                  <Icon size={30} style={{ color }} strokeWidth={2} />
                </span>
                <span className="text-base font-bold text-stone-700 leading-tight text-center">{label}</span>
                {total > 0 && (
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full text-white"
                    style={{ background: color }}
                  >
                    {fmtARS(total)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Teclado numérico ── */}
      {activeCat && (
        <NumericKeyboard
          category={activeCat}
          onConfirm={handleConfirm}
          onClose={() => setActiveCat(null)}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <div
          role="status" aria-live="polite"
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50
            bg-stone-800 text-white px-6 py-3 rounded-2xl shadow-2xl
            text-base font-semibold flex items-center gap-2 whitespace-nowrap
            animate-[bounceIn_0.35s_cubic-bezier(0.34,1.56,0.64,1)_forwards]"
        >
          ✓ Guardado — {toast}
        </div>
      )}
    </div>
  );
}
`;

// ─── src/App.jsx ──────────────────────────────────────────────────────────────
files["src/App.jsx"] = `// src/App.jsx
import Dashboard from "./components/Dashboard";

export default function App() {
  return <Dashboard />;
}
`;

// ─── src/index.css ────────────────────────────────────────────────────────────
files["src/index.css"] = `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    font-size: 18px;                   /* Base grande para adultos mayores */
    -webkit-text-size-adjust: 100%;
    touch-action: manipulation;        /* Elimina delay 300ms en iOS */
  }
  body {
    background-color: #FFFBF5;
    -webkit-font-smoothing: antialiased;
  }
  :focus-visible {
    outline: 3px solid #F59E0B;
    outline-offset: 3px;
  }
  button {
    -webkit-tap-highlight-color: transparent;
    cursor: pointer;
  }
}

@keyframes bounceIn {
  0%   { opacity: 0; transform: translateX(-50%) translateY(16px) scale(0.95); }
  60%  { opacity: 1; transform: translateX(-50%) translateY(-4px) scale(1.02); }
  100% { opacity: 1; transform: translateX(-50%) translateY(0)    scale(1);    }
}
`;

// ─── tailwind.config.js ───────────────────────────────────────────────────────
files["tailwind.config.js"] = `/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ["Georgia", "Times New Roman", "serif"],
      },
    },
  },
  plugins: [],
};
`;

// ─── postcss.config.js ────────────────────────────────────────────────────────
files["postcss.config.js"] = `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`;

// ─── vite.config.js ───────────────────────────────────────────────────────────
files["vite.config.js"] = `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
});
`;

// ─── index.html ───────────────────────────────────────────────────────────────
files["index.html"] = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
    <meta name="theme-color" content="#FFFBF5" />
    <title>Mi Billetera</title>
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>💰</text></svg>" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`;

// ─── src/main.jsx ─────────────────────────────────────────────────────────────
files["src/main.jsx"] = `import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`;

// ─── .gitignore ───────────────────────────────────────────────────────────────
files[".gitignore"] = `node_modules/
dist/
.env.local
.env.*.local
.DS_Store
`;

// ─── package.json ─────────────────────────────────────────────────────────────
files["package.json"] = `{
  "name": "mi-billetera",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev":     "vite",
    "build":   "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "firebase":     "^10.12.0",
    "lucide-react": "^0.383.0",
    "react":        "^18.3.1",
    "react-dom":    "^18.3.1",
    "recharts":     "^2.12.7"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer":         "^10.4.19",
    "postcss":              "^8.4.38",
    "tailwindcss":          "^3.4.4",
    "vite":                 "^5.3.1"
  }
}
`;

// ─── README.md ────────────────────────────────────────────────────────────────
files["README.md"] = `# 💰 Mi Billetera

App de finanzas personales minimalista para adultos mayores.

## Stack
- React + Vite
- Tailwind CSS
- Recharts
- Firebase Firestore
- lucide-react

## Primeros pasos

\`\`\`bash
npm install          # Instalar dependencias
\`\`\`

2. Completar las claves de Firebase en \`.env.local\`

\`\`\`bash
npm run dev          # Iniciar servidor de desarrollo
\`\`\`

## Estructura

\`\`\`
src/
├── components/
│   ├── Dashboard.jsx        # Pantalla principal + gráfico de dona
│   └── NumericKeyboard.jsx  # Teclado numérico táctil
├── hooks/
│   └── useExpenses.js       # CRUD + suscripción Firestore
├── firebase.js              # Configuración Firebase
├── App.jsx
├── main.jsx
└── index.css
\`\`\`

## Firebase — Índice compuesto requerido

En la consola de Firebase → Firestore → Índices, crear:
- Colección: \`expenses\`
- Campos: \`createdAt ASC\`, \`createdAt ASC\`
- (Firestore lo sugerirá automáticamente la primera vez que corras la app)
`;

// ─────────────────────────────────────────────────────────────────────────────
// EJECUCIÓN
// ─────────────────────────────────────────────────────────────────────────────

head("Mi Billetera — Scaffolding automático");
info("Creando estructura del proyecto...\n");

let created = 0;
let skipped = 0;

for (const [filePath, content] of Object.entries(files)) {
  if (fs.existsSync(filePath)) {
    warn(`Ya existe (omitido): ${filePath}`);
    skipped++;
    continue;
  }
  try {
    writeFile(filePath, content);
    created++;
  } catch (e) {
    err(`Error al crear ${filePath}: ${e.message}`);
    process.exit(1);
  }
}

// ── Resumen ──────────────────────────────────────────────────────────────────
head("Scaffolding completado");
console.log(`  ${GREEN}${BOLD}${created} archivos creados${RESET}  /  ${YELLOW}${skipped} omitidos (ya existían)${RESET}\n`);

console.log(`${BOLD}Próximos pasos:${RESET}
  ${CYAN}1.${RESET} Completá las claves Firebase en ${BOLD}.env.local${RESET}
  ${CYAN}2.${RESET} Instalá las dependencias:   ${BOLD}npm install${RESET}
  ${CYAN}3.${RESET} Levantá el servidor:         ${BOLD}npm run dev${RESET}

${BOLD}Reglas de seguridad en Firestore (pegar en la consola Firebase):${RESET}
  ${YELLOW}rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      match /expenses/{doc} {
        allow read, write: if true; // ⚠ Cambiar a autenticación en producción
      }
    }
  }${RESET}
`);