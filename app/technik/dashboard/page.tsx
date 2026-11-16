"use client";

import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { RouteGuard } from "@/components/route-guard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { pb } from "@/lib/pocketbase";

type TicketSummary = {
  id: string;
  status: string;
  kategoria: string;
  sala: string;
};

export default function TechnicianDashboardPage() {
  const { user, role } = useAuth();
  const [tickets, setTickets] = useState<TicketSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || role !== "technik") {
      return;
    }

    const loadTickets = async () => {
      setIsLoading(true);
      setError("");

      try {
        const records = await pb.collection("tickets").getFullList({ sort: "-created" });
        setTickets(records as unknown as TicketSummary[]);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Nie udało się pobrać danych.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadTickets();
  }, [user, role]);

  const summary = useMemo(() => {
    const openTickets = tickets.filter((ticket) => ticket.status !== "zamkniete");
    const closedTickets = tickets.filter((ticket) => ticket.status === "zamkniete").length;
    const openedByStatus = {
      nowe: openTickets.filter((ticket) => ticket.status === "nowe").length,
      w_realizacji: openTickets.filter((ticket) => ticket.status === "w_realizacji").length,
    };

    const categoryCounts = tickets.reduce<Record<string, number>>((acc, ticket) => {
      const key = ticket.kategoria || "inne";
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    const roomCounts = tickets.reduce<Record<string, number>>((acc, ticket) => {
      const room = String(ticket.sala || "Brak danych");
      acc[room] = (acc[room] ?? 0) + 1;
      return acc;
    }, {});

    const roomWithMostTickets = Object.entries(roomCounts).sort((a, b) => b[1] - a[1])[0];

    const maxCategoryCount = Math.max(...Object.values(categoryCounts), 1);

    return { openTickets: openTickets.length, closedTickets, openedByStatus, categoryCounts, roomWithMostTickets, maxCategoryCount };
  }, [tickets]);

  const categoryLabels: Record<string, string> = {
    multimedia: "Multimedia",
    instalacje: "Instalacje",
    inne: "Inne",
  };

  if (isLoading) {
    return (
      <RouteGuard allowedRoles={["technik"]}>
        <div className="py-6 text-sm text-muted-foreground">Ładowanie dashboardu…</div>
      </RouteGuard>
    );
  }

  return (
    <RouteGuard allowedRoles={["technik"]}>
      <div className="space-y-6 py-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard technika</h1>
          <p className="text-muted-foreground">Podstawowe statystyki zgłoszeń.</p>
        </div>

        {error ? <p className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{error}</p> : null}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader>
              <CardTitle>Otwarte zgłoszenia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-3xl font-bold">{summary.openTickets}</p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Nowe</span>
                  <strong>{summary.openedByStatus.nowe}</strong>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-amber-500" style={{ width: `${Math.max((summary.openedByStatus.nowe / Math.max(tickets.length, 1)) * 100, 5)}%` }} />
                </div>

                <div className="flex items-center justify-between">
                  <span>W realizacji</span>
                  <strong>{summary.openedByStatus.w_realizacji}</strong>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div className="h-2 rounded-full bg-blue-500" style={{ width: `${Math.max((summary.openedByStatus.w_realizacji / Math.max(tickets.length, 1)) * 100, 5)}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Zamknięte zgłoszenia</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{summary.closedTickets}</p>
              <p className="mt-2 text-sm text-muted-foreground">Łącznie: {tickets.length} zgłoszeń</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tematy wg. kategorii</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(summary.categoryCounts).length === 0 ? (
                <p className="text-sm text-muted-foreground">Brak danych.</p>
              ) : (
                Object.entries(summary.categoryCounts).map(([key, count]) => (
                  <div key={key} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>{categoryLabels[key] ?? key}</span>
                      <strong>{count}</strong>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${(count / summary.maxCategoryCount) * 100}%` }} />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Najczęstsza sala</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {summary.roomWithMostTickets ? (
                <>
                  <p className="text-3xl font-bold">{summary.roomWithMostTickets[0]}</p>
                  <p className="text-sm text-muted-foreground">Liczba zgłoszeń: {summary.roomWithMostTickets[1]}</p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Brak danych.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </RouteGuard>
  );
}
