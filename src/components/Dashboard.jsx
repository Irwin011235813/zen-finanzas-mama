// src/components/Dashboard.jsx
import { useState, useCallback } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import {
  ShoppingCart, Heart, Home, Car, Zap,
  Wallet, CreditCard, Banknote, Loader2,
  TrendingUp, TrendingDown, AlertCircle, Trash2, ChevronDown, ChevronUp,
} from "lucide-react";
import { useExpenses } from "../hooks/useExpenses";
import NumericKeyboard from "./NumericKeyboard";

// ─── Categorías ───────────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: "income",    label: "Ingreso",    Icon: Wallet,       color: "#22c55e", type: "income"  },
  { id: "card",      label: "Tarjeta",    Icon: CreditCard,   color: "#ef4444", type: "debt"    },
  { id: "loan",      label: "Préstamo",   Icon: Banknote,     color: "#a855f7", type: "debt"    },
  { id: "food",      label: "Comida",     Icon: ShoppingCart, color: "#FF8042", type: "expense" },
  { id: "health",    label: "Salud",      Icon: Heart,        color: "#00C49F", type: "expense" },
  { id: "home",      label: "Hogar",      Icon: Home,         color: "#0088FE", type: "expense" },
  { id: "transport", label: "Transporte", Icon: Car,          color: "#FFBB28", type: "expense" },
  { id: "services",  label: "Servicios",  Icon: Zap,          color: "#8884d8", type: "expense" },
];

const COLOR_BY_LABEL = CATEGORIES.reduce((acc, c) => { acc[c.label] = c.color; return acc; }, {});
const ICON_BY_LABEL  = CATEGORIES.reduce((acc, c) => { acc[c.label] = c.Icon;  return acc; }, {});

const fmt = (n) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("es-AR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

// ─── Tooltip fijo (no flotante) ──────────────────────────────────────────────
function FixedTooltip({ data }) {
  if (!data) return (
    <div className="h-8 mb-1" />
  );
  return (
    <div className="flex items-center justify-center gap-2 mb-1 h-8">
      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: data.color }} />
      <span className="font-bold text-gray-700 text-sm">{data.name}</span>
      <span className="font-black text-sm" style={{ color: data.color }}>
        {new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(data.value)}
      </span>
    </div>
  );
}

// ─── Balance card ─────────────────────────────────────────────────────────────
function BalanceCard({ summary }) {
  const { balance, totalIncome, totalDebts, totalExpenses } = summary;
  const isPositive = balance >= 0;
  return (
    <div className={`rounded-3xl p-4 shadow-sm ${isPositive ? "bg-green-50" : "bg-red-50"}`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Dinero disponible</p>
          <p className={`text-4xl font-black mt-0.5 ${isPositive ? "text-green-600" : "text-red-600"}`}>
            {fmt(balance)}
          </p>
        </div>
        {isPositive
          ? <TrendingUp  size={36} className="text-green-400 opacity-60" />
          : <TrendingDown size={36} className="text-red-400 opacity-60"  />
        }
      </div>
      <div className="grid grid-cols-3 divide-x divide-gray-200 text-center">
        <div className="pr-2">
          <p className="text-[10px] font-bold text-gray-400 uppercase">Ingresos</p>
          <p className="text-sm font-black text-green-600">{fmt(totalIncome)}</p>
        </div>
        <div className="px-2">
          <p className="text-[10px] font-bold text-gray-400 uppercase">Deudas</p>
          <p className="text-sm font-black text-purple-600">{fmt(totalDebts)}</p>
        </div>
        <div className="pl-2">
          <p className="text-[10px] font-bold text-gray-400 uppercase">Gastos</p>
          <p className="text-sm font-black text-orange-500">{fmt(totalExpenses)}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Historial con botón eliminar ─────────────────────────────────────────────
function History({ expenses, onDelete }) {
  const [open,      setOpen]      = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (id) => {
    setDeletingId(id);
    try { await onDelete(id); } finally { setDeletingId(null); }
  };

  if (expenses.length === 0) return null;

  return (
    <div className="rounded-3xl border border-gray-100 overflow-hidden">
      {/* Header toggle */}
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 active:bg-gray-100 transition-colors"
      >
        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
          Historial del mes ({expenses.length})
        </span>
        {open ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
      </button>

      {/* Lista */}
      {open && (
        <ul className="divide-y divide-gray-50">
          {expenses.map((e) => {
            const Icon  = ICON_BY_LABEL[e.category] ?? Wallet;
            const color = COLOR_BY_LABEL[e.category] ?? "#9ca3af";
            const isDeleting = deletingId === e.id;

            return (
              <li key={e.id} className={`flex items-center gap-3 px-4 py-3 transition-opacity ${isDeleting ? "opacity-40" : ""}`}>
                {/* Ícono */}
                <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: color + "18" }}>
                  <Icon size={18} style={{ color }} />
                </span>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-800 text-sm truncate">{e.category}</p>
                  <p className="text-xs text-gray-400">{fmtDate(e.date)}</p>
                </div>

                {/* Monto */}
                <p className="font-black text-sm flex-shrink-0" style={{ color }}>
                  {fmt(e.amount)}
                </p>

                {/* Borrar */}
                <button
                  onClick={() => handleDelete(e.id)}
                  disabled={isDeleting}
                  aria-label="Eliminar registro"
                  className="w-8 h-8 rounded-full flex items-center justify-center text-gray-300 hover:text-red-400 hover:bg-red-50 active:scale-90 transition-all flex-shrink-0"
                >
                  {isDeleting
                    ? <Loader2 size={15} className="animate-spin" />
                    : <Trash2 size={15} />
                  }
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { summary, chartData, expenses, loading, error, addExpense, deleteExpense } = useExpenses();

  const [activeCat,    setActiveCat]    = useState(null);
  const [saving,       setSaving]       = useState(false);
  const [toast,        setToast]        = useState(null);
  const [hoveredSlice, setHoveredSlice] = useState(null);

  const showToast = (message, isError = false) => {
    setToast({ message, isError });
    setTimeout(() => setToast(null), 2800);
  };

  // FIX: saving=true bloquea el botón mientras Firestore responde
  const handleSave = useCallback(async (amount) => {
    if (!activeCat || saving) return;
    setSaving(true);
    try {
      await addExpense({ category: activeCat.label, type: activeCat.type, amount });
      showToast(`✓ ${activeCat.label}: ${fmt(amount)}`);
      setActiveCat(null);
    } catch (e) {
      showToast("No se pudo guardar. Intentá de nuevo.", true);
    } finally {
      setSaving(false);
    }
  }, [activeCat, saving, addExpense]);

  // Gráfico
  const enrichedChart = chartData.map((d) => ({ ...d, color: COLOR_BY_LABEL[d.name] ?? "#9ca3af" }));
  const hasData       = enrichedChart.length > 0;
  const totalOutflow  = summary.totalDebts + summary.totalExpenses;

  return (
    <div className="flex flex-col min-h-screen bg-white pb-24 px-5"
      style={{ fontFamily: "'Georgia', serif" }}>

      {/* Header */}
      <header className="pt-10 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-800">Control de Gastos</h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">
            {new Date().toLocaleDateString("es-AR", { month: "long", year: "numeric" })}
          </p>
        </div>
        {loading && <Loader2 size={24} className="text-gray-300 animate-spin" />}
      </header>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-100 text-red-600
          rounded-2xl px-4 py-3 text-sm font-semibold mb-3">
          <AlertCircle size={18} />{error}
        </div>
      )}

      {/* Balance */}
      <BalanceCard summary={summary} />

      {/* Tooltip fijo arriba del gráfico — sin superposición */}
      <FixedTooltip data={hoveredSlice} />

      {/* Gráfico */}
      <div className="relative h-52 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={hasData ? enrichedChart : [{ name: "", value: 1, color: "#f3f4f6" }]}
              cx="50%" cy="50%"
              innerRadius="70%" outerRadius="92%"
              paddingAngle={hasData && enrichedChart.length > 1 ? 4 : 0}
              dataKey="value"
              strokeWidth={0}
              animationBegin={0}
              animationDuration={500}
              onMouseEnter={(data) => setHoveredSlice(data)}
              onMouseLeave={() => setHoveredSlice(null)}
            >
              {(hasData ? enrichedChart : [{ color: "#f3f4f6" }]).map((e, i) => (
                <Cell key={i} fill={e.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Etiqueta central */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Egresos</p>
          <p className="text-2xl font-black text-gray-700">{fmt(totalOutflow)}</p>
        </div>
      </div>

      {/* Leyenda del gráfico */}
      {hasData && (
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mb-3">
          {enrichedChart.map((d) => (
            <div key={d.name} className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
              <span className="text-xs text-gray-500 font-semibold">{d.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* Botones de categorías */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {CATEGORIES.map(({ id, label, Icon, color, type }) => (
          <button
            key={id}
            onClick={() => setActiveCat({ id, label, Icon, color, type })}
            aria-label={`Registrar ${label}`}
            className="flex flex-col items-center justify-center gap-1.5 p-4 rounded-2xl
              border-b-4 border-gray-100 active:scale-95 transition-transform duration-75
              focus-visible:ring-4 outline-none"
            style={{ backgroundColor: `${color}18`, color }}
          >
            <Icon size={30} strokeWidth={2} />
            <span className="font-bold text-sm text-gray-700">{label}</span>
          </button>
        ))}
      </div>

      {/* Historial con botón eliminar */}
      <History expenses={expenses} onDelete={deleteExpense} />

      {/* Teclado — le pasamos `saving` para bloquear el botón */}
      {activeCat && (
        <NumericKeyboard
          category={activeCat}
          saving={saving}
          onClose={() => !saving && setActiveCat(null)}
          onConfirm={handleSave}
        />
      )}

      {/* Toast */}
      {toast && (
        <div
          role="status" aria-live="polite"
          className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl
            shadow-xl flex items-center gap-2 text-sm font-bold text-white whitespace-nowrap
            ${toast.isError ? "bg-red-500" : "bg-gray-800"}`}
          style={{ animation: "slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1) forwards" }}
        >
          {toast.isError && <AlertCircle size={16} />}
          {toast.message}
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity:0; transform: translateX(-50%) translateY(12px) scale(0.96); }
          to   { opacity:1; transform: translateX(-50%) translateY(0)     scale(1);   }
        }
      `}</style>
    </div>
  );
}