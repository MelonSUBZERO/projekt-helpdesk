"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { useAuth } from "@/components/auth-provider";

export function RouteGuard({
  allowedRoles,
  children,
}: {
  allowedRoles?: Array<"uzytkownik" | "technik">;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, role, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!user) {
      router.replace("/login");
      return;
    }

    if (allowedRoles && role && !allowedRoles.includes(role)) {
      router.replace(role === "technik" ? "/technik" : "/zgloszenia");
      return;
    }

    if (pathname === "/" && role === "technik") {
      router.replace("/technik");
    }

    if (pathname === "/" && role === "uzytkownik") {
      router.replace("/zgloszenia");
    }
  }, [allowedRoles, isLoading, pathname, role, router, user]);

  if (isLoading) {
    return <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">Ładowanie…</div>;
  }

  if (!user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-sm text-muted-foreground">
        <span>Musisz być zalogowany.</span>
        <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
          Zaloguj się
        </Link>
      </div>
    );
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return null;
  }

  return <>{children}</>;
}
