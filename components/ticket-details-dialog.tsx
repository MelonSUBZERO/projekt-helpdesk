"use client";

import { CalendarDays, Image as ImageIcon, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { pb } from "@/lib/pocketbase";
import { cn } from "@/lib/utils";

type TicketDetails = {
  id: string;
  tytul: string;
  opis?: string;
  sala: string;
  kategoria: string;
  priorytet: string;
  status: string;
  zdjecie?: string;
  komentarz?: string;
  created: string;
  expand?: { autor?: { name?: string; email?: string } };
};

type TicketEvent = {
  id: string;
  created: string;
  pierwotny_status: string;
  nowy_status: string;
  expand?: { zmieniajacu?: { name?: string; email?: string } };
};

export function TicketDetailsDialog({
  ticket,
  onClose,
}: {
  ticket: TicketDetails | null;
  onClose: () => void;
}) {
  const [history, setHistory] = useState<TicketEvent[]>([]);
  const [historyError, setHistoryError] = useState<{ ticketId: string; message: string } | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState(false);

  useEffect(() => {
    if (!ticket) {
      return;
    }

    const loadHistory = async () => {
      try {
        const records = await pb.collection("ticket_events").getFullList({
          filter: `zgloszenie = "${ticket.id}"`,
          sort: "-created",
          expand: "zmieniajacu",
        });
        setHistory(records as unknown as TicketEvent[]);
        setHistoryError(null);
      } catch (error) {
        setHistoryError({
          ticketId: ticket.id,
          message: error instanceof Error ? error.message : "Nie udało się pobrać historii zgłoszenia.",
        });
      }
    };

    const loadImage = async () => {
      if (!ticket.zdjecie) {
        setImageUrl(null);
        return;
      }

      try {
        setIsLoadingImage(true);
        const token = await pb.files.getToken();
        setImageUrl(pb.files.getURL(ticket, ticket.zdjecie, { token }));
      } catch {
        setImageUrl(null);
      } finally {
        setIsLoadingImage(false);
      }
    };

    void loadHistory();
    void loadImage();
  }, [ticket]);

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

  if (!ticket) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl border bg-card p-4 shadow-lg sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">Szczegóły zgłoszenia</p>
            <h3 className="text-2xl font-semibold">{ticket.tytul}</h3>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Zamknij
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-[1.5fr_1fr]">
          <div className="space-y-4">
            <Card>
              <CardContent className="space-y-4 p-4">
                <div className="flex flex-wrap gap-2">
                  <Badge>{statusLabel[ticket.status as keyof typeof statusLabel] ?? ticket.status}</Badge>
                  <Badge variant="secondary">{categoryLabel[ticket.kategoria as keyof typeof categoryLabel] ?? ticket.kategoria}</Badge>
                  <Badge variant="outline">
                    {priorityLabel[ticket.priorytet as keyof typeof priorityLabel] ?? ticket.priorytet}
                  </Badge>
                </div>

                <div>
                  <p className="mb-1 text-sm font-medium text-muted-foreground">Opis</p>
                  <p className="whitespace-pre-wrap text-sm leading-6">{ticket.opis ?? "—"}</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Sala</p>
                    <p className="font-medium">{ticket.sala}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Autor</p>
                    <p className="font-medium">{ticket.expand?.autor?.name || ticket.expand?.autor?.email || "—"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CalendarDays className="size-4" />
                  <span>{new Date(ticket.created).toLocaleString("pl-PL")}</span>
                </div>
              </CardContent>
            </Card>

            {ticket.komentarz ? (
              <Card>
                <CardContent className="p-4">
                  <p className="mb-2 text-sm font-medium text-muted-foreground">Komentarz technika</p>
                  <p className="whitespace-pre-wrap text-sm leading-6">{ticket.komentarz}</p>
                </CardContent>
              </Card>
            ) : null}

            {ticket.zdjecie ? (
              <Card>
                <CardContent className="p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <ImageIcon className="size-4" />
                    Zdjęcie
                  </div>
                  {isLoadingImage ? <p className="text-sm text-muted-foreground">Ładowanie zdjęcia…</p> : null}
                  {imageUrl ? (
                    <img src={imageUrl} alt={ticket.tytul} className="max-h-80 rounded-lg border object-contain" />
                  ) : (
                    <p className="text-sm text-muted-foreground">Nie udało się pobrać zdjęcia.</p>
                  )}
                </CardContent>
              </Card>
            ) : null}
          </div>

          <div className="space-y-4">
            <Card>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <UserRound className="size-4" />
                  Historia zmian statusu
                </div>

                {historyError?.ticketId === ticket.id ? (
                  <p className="text-sm text-destructive">
                    Nie udało się pobrać historii zmian: {historyError.message}
                  </p>
                ) : history.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Brak historii zmian dla tego zgłoszenia.</p>
                ) : (
                  <div className="space-y-3">
                    {history.map((event) => (
                      <div
                        key={event.id}
                        className={cn(
                          "rounded-lg border p-3",
                          event.nowy_status === "zamkniete" ? "bg-emerald-50 dark:bg-emerald-950/30" : "bg-muted/50",
                        )}
                      >
                        <p className="text-xs text-muted-foreground">{new Date(event.created).toLocaleString("pl-PL")}</p>
                        <p className="mt-1 text-sm font-medium">
                          {event.pierwotny_status} → {event.nowy_status}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {event.expand?.zmieniajacu?.name || event.expand?.zmieniajacu?.email || "Technik"}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
