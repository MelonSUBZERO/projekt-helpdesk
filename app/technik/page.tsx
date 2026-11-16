"use client";

import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { RouteGuard } from "@/components/route-guard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getPocketbaseErrorMessage, pb } from "@/lib/pocketbase";

type TicketRecord = {
  id: string;
  tytul: string;
  opis: string;
  sala: string;
  kategoria: string;
  priorytet: string;
  status: string;
  komentarz?: string;
  zdjecie?: string;
  created: string;
  expand?: {
    autor?: {
      name?: string;
      email?: string;
    };
  };
};

export default function TechnikTicketsPage() {
  const { user, role } = useAuth();
  const [tickets, setTickets] = useState<TicketRecord[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [roomFilter, setRoomFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [realtimeMessage, setRealtimeMessage] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<TicketRecord | null>(null);
  const [editorStatus, setEditorStatus] = useState("nowe");
  const [editorComment, setEditorComment] = useState("");
  const [editorError, setEditorError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const statusOptions = [
    { value: "all", label: "Wszystkie" },
    { value: "nowe", label: "Nowe" },
    { value: "w_realizacji", label: "W realizacji" },
    { value: "zamkniete", label: "Zamknięte" },
  ];

  const priorityOptions = [
    { value: "all", label: "Wszystkie" },
    { value: "niski", label: "Niski" },
    { value: "wysoki", label: "Wysoki" },
  ];

  const loadTicketList = async () => {
    if (!user || role !== "technik") {
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const filterParts: string[] = [];

      if (statusFilter !== "all") {
        filterParts.push(pb.filter("status = {:status}", { status: statusFilter }));
      }

      if (priorityFilter !== "all") {
        filterParts.push(pb.filter("priorytet = {:priority}", { priority: priorityFilter }));
      }

      if (roomFilter.trim()) {
        filterParts.push(pb.filter("sala ~ {:room}", { room: roomFilter.trim() }));
      }

      const filter = filterParts.length > 0 ? filterParts.join(" && ") : "";
      const result = await pb.collection("tickets").getList(page - 1, 20, {
        filter,
        sort: "-created",
        expand: "autor",
      });

      setTickets(result.items as unknown as TicketRecord[]);
      setTotalPages(result.totalPages || 1);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Nie udało się pobrać zgłoszeń.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadTicketList();
  }, [user, role, page, statusFilter, priorityFilter, roomFilter]);

  useEffect(() => {
    if (!user || role !== "technik") {
      return;
    }

    let unsubscribe: (() => void) | undefined;

    const subscribe = async () => {
      unsubscribe = await pb.collection("tickets").subscribe("*", async () => {
        setRealtimeMessage("Zaktualizowano listę zgłoszeń.");
        setPage(1);
        await loadTicketList();
      });
    };

    void subscribe();

    return () => {
      unsubscribe?.();
    };
  }, [user, role, statusFilter, priorityFilter, roomFilter]);

  const statusLabel = useMemo(
    () => ({
      nowe: "Nowe",
      w_realizacji: "W realizacji",
      zamkniete: "Zamknięte",
    }),
    [],
  );

  const priorityLabel = useMemo(
    () => ({
      niski: "Niski",
      wysoki: "Wysoki",
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

  const openEditor = (ticket: TicketRecord) => {
    setSelectedTicket(ticket);
    setEditorStatus(ticket.status);
    setEditorComment(ticket.komentarz || "");
    setEditorError("");
  };

  const saveTicket = async () => {
    if (!selectedTicket || !user) {
      return;
    }

    setEditorError("");
    setIsSaving(true);

    try {
      const initialStatus = selectedTicket.status;
      const useComment = editorComment.trim();
      const statusChanged = initialStatus !== editorStatus;

      if (statusChanged) {
        await pb.collection("tickets").update(selectedTicket.id, {
          status: editorStatus,
          komentarz: useComment,
        });

        try {
          await pb.collection("ticket_events").create({
            zgloszenie: selectedTicket.id,
            zmieniajacu: user.id,
            zmieniajacy: user.id,
            pierwotny_status: initialStatus,
            nowy_status: editorStatus,
          });
        } catch (historyError) {
          setSelectedTicket({ ...selectedTicket, status: editorStatus, komentarz: useComment });
          setEditorError(
            `Status i komentarz zapisano, ale nie udało się dodać wpisu do historii: ${getPocketbaseErrorMessage(historyError)}`,
          );
          await loadTicketList();
          return;
        }
      } else {
        await pb.collection("tickets").update(selectedTicket.id, {
          komentarz: useComment,
        });
      }

      setSelectedTicket(null);
      setRealtimeMessage("Zgłoszenie zostało zaktualizowane.");
      await loadTicketList();
    } catch (error) {
      setEditorError(`Nie udało się zapisać zmian: ${getPocketbaseErrorMessage(error)}`);
    } finally {
      setIsSaving(false);
    }
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setPriorityFilter("all");
    setRoomFilter("");
    setPage(1);
  };

  return (
    <RouteGuard allowedRoles={["technik"]}>
      <div className="space-y-6 py-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Zgłoszenia technika</h1>
          <p className="text-muted-foreground">Przejrzyj zgłoszenia, filtruj je i aktualizuj statusy.</p>
        </div>

        {realtimeMessage ? (
          <div className="rounded-md border border-green-500/30 bg-green-500/5 p-3 text-sm text-green-700 dark:text-green-400">{realtimeMessage}</div>
        ) : null}

        {error ? <p className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">{error}</p> : null}

        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="grid gap-3 md:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <select
                  value={statusFilter}
                  onChange={(event) => {
                    setStatusFilter(event.target.value);
                    setPage(1);
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Priorytet</label>
                <select
                  value={priorityFilter}
                  onChange={(event) => {
                    setPriorityFilter(event.target.value);
                    setPage(1);
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {priorityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Sala</label>
                <Input
                  value={roomFilter}
                  onChange={(event) => {
                    setRoomFilter(event.target.value);
                    setPage(1);
                  }}
                  placeholder="Szukaj po nazwie sali"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="button" variant="outline" onClick={clearFilters}>
                Wyczyść filtry
              </Button>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="rounded-lg border bg-card p-6 text-sm text-muted-foreground">Ładowanie zgłoszeń…</div>
        ) : (
          <>
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tytuł</TableHead>
                    <TableHead>Autor</TableHead>
                    <TableHead>Sala</TableHead>
                    <TableHead>Kategoria</TableHead>
                    <TableHead>Priorytet</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Akcje</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell>{new Date(ticket.created).toLocaleDateString("pl-PL")}</TableCell>
                      <TableCell className="font-medium">{ticket.tytul}</TableCell>
                      <TableCell>{ticket.expand?.autor?.name || ticket.expand?.autor?.email || "—"}</TableCell>
                      <TableCell>{ticket.sala}</TableCell>
                      <TableCell>{categoryLabel[ticket.kategoria as keyof typeof categoryLabel] ?? ticket.kategoria}</TableCell>
                      <TableCell>{priorityLabel[ticket.priorytet as keyof typeof priorityLabel] ?? ticket.priorytet}</TableCell>
                      <TableCell>
                        <Badge>{statusLabel[ticket.status as keyof typeof statusLabel] ?? ticket.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button type="button" variant="outline" size="sm" onClick={() => openEditor(ticket)}>
                          Szczegóły
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="grid gap-4 md:hidden">
              {tickets.map((ticket) => (
                <Card key={ticket.id}>
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{ticket.tytul}</p>
                        <p className="text-xs text-muted-foreground">{new Date(ticket.created).toLocaleDateString("pl-PL")}</p>
                      </div>
                      <Badge>{statusLabel[ticket.status as keyof typeof statusLabel] ?? ticket.status}</Badge>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      <p>Autor: {ticket.expand?.autor?.name || ticket.expand?.autor?.email || "—"}</p>
                      <p>Sala: {ticket.sala}</p>
                      <p>Kategoria: {categoryLabel[ticket.kategoria as keyof typeof categoryLabel] ?? ticket.kategoria}</p>
                      <p>Priorytet: {priorityLabel[ticket.priorytet as keyof typeof priorityLabel] ?? ticket.priorytet}</p>
                    </div>

                    <Button type="button" variant="outline" size="sm" onClick={() => openEditor(ticket)}>
                      Szczegóły
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">Strona {page} z {totalPages}</p>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setPage((prev) => Math.max(prev - 1, 1))} disabled={page === 1}>
                  Poprzednia
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))} disabled={page >= totalPages}>
                  Następna
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {selectedTicket ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border bg-card p-4 shadow-lg sm:p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Szczegóły zgłoszenia</p>
                <h3 className="text-2xl font-semibold">{selectedTicket.tytul}</h3>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => setSelectedTicket(null)}>
                Zamknij
              </Button>
            </div>

            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Autor</p>
                  <p className="font-medium">{selectedTicket.expand?.autor?.name || selectedTicket.expand?.autor?.email || "—"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sala</p>
                  <p className="font-medium">{selectedTicket.sala}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Kategoria</p>
                  <p className="font-medium">{categoryLabel[selectedTicket.kategoria as keyof typeof categoryLabel] ?? selectedTicket.kategoria}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Priorytet</p>
                  <p className="font-medium">{priorityLabel[selectedTicket.priorytet as keyof typeof priorityLabel] ?? selectedTicket.priorytet}</p>
                </div>
              </div>

              <div>
                <p className="mb-1 text-sm text-muted-foreground">Opis</p>
                <p className="whitespace-pre-wrap text-sm leading-6">{selectedTicket.opis}</p>
              </div>

              {selectedTicket.zdjecie ? (
                <div>
                  <p className="mb-2 text-sm text-muted-foreground">Zdjęcie</p>
                  <TicketImage src={selectedTicket} />
                </div>
              ) : null}

              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <select
                  value={editorStatus}
                  onChange={(event) => setEditorStatus(event.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value} disabled={option.value === "all"}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Komentarz technika</label>
                <textarea
                  value={editorComment}
                  onChange={(event) => setEditorComment(event.target.value)}
                  maxLength={1000}
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              {editorError ? <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{editorError}</p> : null}

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setSelectedTicket(null)}>
                  Anuluj
                </Button>
                <Button type="button" onClick={saveTicket} disabled={isSaving}>
                  {isSaving ? "Zapisywanie…" : "Zapisz zmiany"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </RouteGuard>
  );
}

function TicketImage({ src }: { src: TicketRecord }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadImage = async () => {
      if (!src.zdjecie) {
        setUrl(null);
        return;
      }

      try {
        const token = await pb.files.getToken();
        setUrl(pb.files.getURL(src, src.zdjecie, { token }));
      } catch {
        setUrl(null);
      }
    };

    void loadImage();
  }, [src]);

  if (!url) {
    return <p className="text-sm text-muted-foreground">Nie udało się pobrać zdjęcia.</p>;
  }

  return <img src={url} alt="Zdjęcie zgłoszenia" className="max-h-72 rounded-lg border object-contain" />;
}
