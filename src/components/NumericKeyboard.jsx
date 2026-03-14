// src/components/NumericKeyboard.jsx
import { useState, useEffect, useCallback } from "react";
import { Delete, Loader2 } from "lucide-react";

export default function NumericKeyboard({ category, onConfirm, onClose, saving }) {
  const [value, setValue] = useState("");

  useEffect(() => {
    const h = (e) => {
      if (saving) return;                          // bloquear teclado físico también
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
  const confirm = useCallback(()  => { if (+value > 0 && !saving) onConfirm(+value); }, [value, saving, onConfirm]);

  const display    = value || "0";
  const canConfirm = +value > 0 && !saving;

  const fmt = (n) =>
    new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 }).format(n);

  const rows = [["7","8","9"],["4","5","6"],["1","2","3"],["C","0","⌫"]];

  return (
    <div
      role="dialog" aria-modal="true"
      aria-label={`Ingresar monto para ${category.label}`}
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(15,10,5,0.6)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="w-full max-w-sm rounded-t-3xl pb-10 pt-6 px-5 bg-white"
        style={{ boxShadow: `0 -10px 50px ${category.color}44` }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <span className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
              style={{ background: category.color + "18" }}>
              <category.Icon size={28} style={{ color: category.color }} />
            </span>
            <div>
              <p className="text-xs font-bold tracking-widest text-gray-400 uppercase">Gasto en</p>
              <p className="text-2xl font-bold text-gray-800">{category.label}</p>
            </div>
          </div>
          {/* X deshabilitado mientras guarda */}
          <button
            onClick={onClose}
            disabled={saving}
            aria-label="Cancelar"
            className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center
              text-gray-500 text-xl font-bold active:scale-90 transition-transform
              disabled:opacity-40"
          >
            ✕
          </button>
        </div>

        {/* Display */}
        <div
          className="w-full rounded-2xl px-5 py-4 mb-5 flex items-center justify-between bg-gray-50 border-2 transition-colors"
          style={{ borderColor: canConfirm ? category.color : "#e5e7eb" }}
        >
          <span className="text-3xl font-semibold text-gray-300">$</span>
          <span className="text-5xl font-bold text-gray-800 tracking-tight" aria-live="polite">
            {display}
          </span>
        </div>

        {/* Keypad — deshabilitado mientras guarda */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {rows.flat().map((k) => (
            <button
              key={k}
              disabled={saving}
              onClick={() => k === "C" ? clear() : k === "⌫" ? pop() : push(k)}
              aria-label={k === "⌫" ? "Borrar" : k === "C" ? "Limpiar" : k}
              className={`
                h-16 rounded-2xl font-bold text-3xl flex items-center justify-center
                select-none transition-all duration-75
                focus-visible:ring-4 outline-none
                disabled:opacity-40
                ${k === "C" || k === "⌫"
                  ? "bg-gray-100 text-gray-600 active:scale-90"
                  : "bg-gray-50 text-gray-800 shadow-sm border border-gray-100 active:scale-90"
                }
              `}
            >
              {k === "⌫" ? <Delete size={26} /> : k}
            </button>
          ))}
        </div>

        {/* Botón guardar — muestra spinner mientras saving=true */}
        <button
          onClick={confirm}
          disabled={!canConfirm}
          aria-label="Confirmar gasto"
          className="w-full h-16 rounded-2xl text-xl font-bold text-white
            flex items-center justify-center gap-3
            transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: canConfirm ? category.color : "#d1d5db",
            boxShadow: canConfirm ? `0 6px 24px ${category.color}55` : "none",
          }}
        >
          {saving
            ? <><Loader2 size={24} className="animate-spin" /> Guardando...</>
            : <>✓ Guardar {+value > 0 ? fmt(+value) : ""}</>
          }
        </button>
      </div>
    </div>
  );
}