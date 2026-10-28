"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

// بيجيب الساعات المحجوزة في يوم معين من Supabase، ويعيد الجلب لما اليوم يتغير
// enabled = false: ميجيبش حاجة (مثلاً لو النافذة مقفولة)
export function useTakenSlots(day, { enabled = true } = {}) {
  const [taken, setTaken] = useState([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false; // لو اليوم اتغير بسرعة، نتجاهل الرد القديم

    async function load() {
      setLoading(true);
      setError(false);
      const { data, error } = await supabase.rpc("get_taken_slots", { d: day });
      if (cancelled) return;

      if (error) {
        setError(true);
        setTaken([]);
      } else {
        setTaken(data.map((row) => row.slot_time)); // [{slot_time:"17:30:00"}] ← ["17:30:00"]
      }
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [day, enabled, reloadKey]);

  return { taken, loading, error, reload: () => setReloadKey((k) => k + 1) };
}
