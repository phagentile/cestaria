"use client";

import { useEffect } from "react";
import { seedDefaults } from "@/lib/db";
import { useSyncEngine } from "@/lib/use-sync";

export function AppInit() {
  useSyncEngine();

  useEffect(() => {
    seedDefaults();
  }, []);
  return null;
}
