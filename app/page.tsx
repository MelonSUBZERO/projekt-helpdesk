"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/components/auth-provider";

export default function HomePage() {
  const router = useRouter();
  const { user, role, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!user) {
      router.replace("/login");
      return;
    }

    router.replace(role === "technik" ? "/technik" : "/zgloszenia");
  }, [isLoading, role, router, user]);

  return <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">Przekierowanie…</div>;
}
