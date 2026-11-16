"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="Przełącz motyw"
      className="relative"
    >
      <Sun className="size-4 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute size-4 scale-0 transition-all dark:scale-100" />
    </Button>
  );
}
