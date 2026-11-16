"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { RouteGuard } from "@/components/route-guard";
import { TicketDetailsDialog } from "@/components/ticket-details-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { pb } from "@/lib/pocketbase";

type UserTicket = {
  id: string;
  tytul: string;
  sala: string;
  kategoria: string;
  priorytet: string;
  status: string;
  created: string;
  opis: string;
  komentarz?: string;
  zdjecie?: string;
  expand?: {
    autor?: {
      name?: string;
      email?: string;
    };
  };
};

export default function UserTicketsPage() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<UserTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<UserTicket | null>(null);

  const loadTickets = async () => {
    if (!user?.id) {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const records = await pb.collection("tickets").getFullList({
        filter: `autor = "${user.id}"`,
        sort: "-created",
        expand: "autor",
      });
      setTickets(
        records.map((record) => ({
          ...record,
          opis: record.opis ?? "",
        })) as unknown as UserTicket[],
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Nie udało się pobrać zgłoszeń.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void loadTickets();
    }
  }, [user]);

  const statusLabel = useMemo(
    () => ({
      nowe: "Nowe",
      w_realizacji: "W realizacji",
      zamkniete: "Zamknięte",
    }),
    [],
  );

  const categoryLabel = useMemo(
    () => ({
      multimedia: "Multimedia",
      instalacje: "Instalacje",
      inne: "Inne",
    }),
    [],
  );

  const priorityLabel = useMemo(
    () => ({
      niski: "Niski",
      sredni: "Średni",
      wysoki: "Wysoki",
    }),
    [],
  );

  return (
    <RouteGuard allowedRoles={["uzytkownik"]}>
      <div className="space-y-6 py-6">
        <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Moje zgłoszenia</h1>
            <p className="text-muted-foreground">Przeglądaj i monitoruj status swoich zgłoszeń.</p>
          </div>
          <Link href="/zgloszenia/nowe">
            <Button type="button">+ Nowe zgłoszenie</Button>
          </Link>
        </div>

        {error ? <p className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{error}</p> : null}

        {isLoading ? (
          <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">Ładowanie zgłoszeń…</div>
        ) : tickets.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              Brak zgłoszeń. <Link href="/zgloszenia/nowe" className="font-medium text-primary underline-offset-4 hover:underline">Utwórz pierwsze zgłoszenie</Link>.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {tickets.map((ticket) => (
              <button
                key={ticket.id}
                type="button"
                className="w-full rounded-xl border bg-card p-4 text-left shadow-sm transition hover:border-primary/50 hover:shadow-md"
                onClick={() => setSelectedTicket(ticket)}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-lg font-semibold">{ticket.tytul}</p>
                    <p className="text-sm text-muted-foreground">Sala: {ticket.sala}</p>
                  </div>
                  <Badge>{statusLabel[ticket.status as keyof typeof statusLabel] ?? ticket.status}</Badge>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary">{categoryLabel[ticket.kategoria as keyof typeof categoryLabel] ?? ticket.kategoria}</Badge>
                  <Badge variant="outline">
                    Priorytet: {priorityLabel[ticket.priorytet as keyof typeof priorityLabel] ?? ticket.priorytet}
                  </Badge>
                  <span>{new Date(ticket.created).toLocaleString("pl-PL")}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <TicketDetailsDialog ticket={selectedTicket} onClose={() => setSelectedTicket(null)} />
    </RouteGuard>
  );
}
