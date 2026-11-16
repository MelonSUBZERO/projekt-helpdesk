"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/components/auth-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export function AppHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, logout } = useAuth();

  const isTechnik = role === "technik";

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <header className="border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-4">
          <Link href={isTechnik ? "/technik" : "/zgloszenia"} className="text-lg font-bold text-foreground">
            Helpdesk
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            {isTechnik ? (
              <>
                <Link
                  href="/technik"
                  className={pathname.startsWith("/technik") ? "rounded-full bg-muted px-3 py-2 text-sm font-medium" : "rounded-full px-3 py-2 text-sm text-muted-foreground hover:bg-muted"}
                >
                  Zgłoszenia
                </Link>
                <Link
                  href="/technik/dashboard"
                  className={pathname.startsWith("/technik/dashboard") ? "rounded-full bg-muted px-3 py-2 text-sm font-medium" : "rounded-full px-3 py-2 text-sm text-muted-foreground hover:bg-muted"}
                >
                  Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/zgloszenia"
                  className={pathname.startsWith("/zgloszenia") ? "rounded-full bg-muted px-3 py-2 text-sm font-medium" : "rounded-full px-3 py-2 text-sm text-muted-foreground hover:bg-muted"}
                >
                  Moje zgłoszenia
                </Link>
                <Link
                  href="/zgloszenia/nowe"
                  className={pathname === "/zgloszenia/nowe" ? "rounded-full bg-muted px-3 py-2 text-sm font-medium" : "rounded-full px-3 py-2 text-sm text-muted-foreground hover:bg-muted"}
                >
                  Nowe zgłoszenie
                </Link>
              </>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-foreground">{user.name || user.email || "Użytkownik"}</p>
                <p className="text-xs text-muted-foreground">{role === "technik" ? "Technik" : "Użytkownik"}</p>
              </div>
              <ThemeToggle />
              <Button type="button" variant="outline" size="sm" onClick={handleLogout}>
                Wyloguj
              </Button>
            </>
          ) : (
            <>
              <ThemeToggle />
              <Link href="/login">
                <Button type="button" variant="outline" size="sm">
                  Zaloguj
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
