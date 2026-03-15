"use client";

import { useEffect } from "react";
import { seedDefaults } from "@/lib/db";

export function AppInit() {
  useEffect(() => {
    seedDefaults();
  }, []);
  return null;
}
