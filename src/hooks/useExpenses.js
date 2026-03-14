// src/hooks/useExpenses.js
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  collection, addDoc, deleteDoc, doc,
  onSnapshot, query, serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

const COLLECTION = "expenses";

export function useExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  // ── Suscripción — filtramos el mes en el cliente (sin índice compuesto) ──
  useEffect(() => {
    const q = query(collection(db, COLLECTION));

    const unsub = onSnapshot(q,
      (snap) => {
        const now   = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

        const docs = snap.docs
          .map((d) => ({
            id: d.id,
            ...d.data(),
            date: d.data().date?.toDate() ?? new Date(),
          }))
          .filter((d) => d.date >= start && d.date <= end)
          .sort((a, b) => b.date - a.date);

        setExpenses(docs);
        setLoading(false);
        setError(null);
      },
      (e) => {
        setError("No se pudo conectar. Revisá tu conexión.");
        setLoading(false);
      }
    );

    return unsub;
  }, []);

  // ── Agregar ──────────────────────────────────────────────────────────────
  const addExpense = useCallback(async ({ category, type, amount }) => {
    if (!category || !type || !(amount > 0)) throw new Error("Datos inválidos.");
    await addDoc(collection(db, COLLECTION), {
      category,
      type,
      amount: Number(amount),
      date: serverTimestamp(),
    });
  }, []);

  // ── Eliminar ─────────────────────────────────────────────────────────────
  const deleteExpense = useCallback(async (id) => {
    await deleteDoc(doc(db, COLLECTION, id));
  }, []);

  // ── Totales ───────────────────────────────────────────────────────────────
  const summary = useMemo(() => {
    const totalIncome   = expenses.filter((e) => e.type === "income").reduce((s, e) => s + e.amount, 0);
    const totalDebts    = expenses.filter((e) => e.type === "debt").reduce((s, e) => s + e.amount, 0);
    const totalExpenses = expenses.filter((e) => e.type === "expense").reduce((s, e) => s + e.amount, 0);
    return { totalIncome, totalDebts, totalExpenses, balance: totalIncome - totalDebts - totalExpenses };
  }, [expenses]);

  const chartData = useMemo(() => {
    const map = expenses
      .filter((e) => e.type !== "income")
      .reduce((acc, e) => { acc[e.category] = (acc[e.category] ?? 0) + e.amount; return acc; }, {});
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [expenses]);

  return { expenses, loading, error, addExpense, deleteExpense, summary, chartData };
}