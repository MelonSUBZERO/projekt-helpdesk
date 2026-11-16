"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { useAuth } from "@/components/auth-provider";
import { RouteGuard } from "@/components/route-guard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { pb } from "@/lib/pocketbase";
import { normalizeRoom } from "@/lib/utils";

export default function NewTicketPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [rooms, setRooms] = useState<string[]>([]);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<{
    tytul: string;
    opis: string;
    sala: string;
    kategoria: string;
    priorytet: string;
  }>({
    defaultValues: {
      tytul: "",
      opis: "",
      sala: "",
      kategoria: "multimedia",
      priorytet: "niski",
    },
  });

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    const loadRooms = async () => {
      try {
        const records = await pb.collection("tickets").getFullList({
          filter: `autor = "${user.id}"`,
          sort: "-created",
        });

        const uniqueRooms = Array.from(
          new Set(records.map((record) => normalizeRoom(String(record.sala || "")).trim()).filter(Boolean)),
        );
        setRooms(uniqueRooms);
      } catch {
        setRooms([]);
      }
    };

    void loadRooms();
  }, [user]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      setSelectedImage(null);
      setImagePreview(null);
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      setSubmitError("Dozwolone są tylko pliki JPEG, PNG, WebP lub GIF.");
      event.target.value = "";
      setSelectedImage(null);
      setImagePreview(null);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setSubmitError("Zdjęcie nie może przekraczać 5 MB.");
      event.target.value = "";
      setSelectedImage(null);
      setImagePreview(null);
      return;
    }

    setSubmitError("");
    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const onSubmit = async (values: { tytul: string; opis: string; sala: string; kategoria: string; priorytet: string }) => {
    if (!user?.id) {
      setSubmitError("Aby dodać zgłoszenie, musisz być zalogowany.");
      return;
    }

    setSubmitError("");
    setIsSubmitting(true);

    try {
      const normalizedRoom = normalizeRoom(values.sala);
      const formData = new FormData();
      formData.append("tytul", values.tytul.trim());
      formData.append("opis", values.opis.trim());
      formData.append("sala", normalizedRoom);
      formData.append("kategoria", values.kategoria);
      formData.append("priorytet", values.priorytet);
      formData.append("autor", user.id);
      formData.append("status", "nowe");
      if (selectedImage) {
        formData.append("zdjecie", selectedImage);
      }

      await pb.collection("tickets").create(formData);
      router.push("/zgloszenia");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Nie udało się dodać zgłoszenia.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <RouteGuard allowedRoles={["uzytkownik"]}>
      <div className="mx-auto max-w-3xl py-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Nowe zgłoszenie</CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="tytul">Tytuł</Label>
                <Input
                  id="tytul"
                  {...register("tytul", {
                    required: "Tytuł jest wymagany.",
                    minLength: { value: 3, message: "Tytuł musi mieć co najmniej 3 znaki." },
                    maxLength: { value: 100, message: "Tytuł może mieć maksymalnie 100 znaków." },
                  })}
                />
                {errors.tytul ? <p className="text-sm text-destructive">{errors.tytul.message}</p> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="opis">Opis</Label>
                <Textarea
                  id="opis"
                  {...register("opis", {
                    required: "Opis jest wymagany.",
                    minLength: { value: 10, message: "Opis musi mieć co najmniej 10 znaków." },
                    maxLength: { value: 2000, message: "Opis może mieć maksymalnie 2000 znaków." },
                  })}
                />
                {errors.opis ? <p className="text-sm text-destructive">{errors.opis.message}</p> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="sala">Sala</Label>
                <Input
                  id="sala"
                  list="roomsList"
                  placeholder="np. A101"
                  {...register("sala", {
                    required: "Sala jest wymagana.",
                    minLength: { value: 2, message: "Sala musi mieć co najmniej 2 znaki." },
                    maxLength: { value: 30, message: "Sala może mieć maksymalnie 30 znaków." },
                  })}
                />
                <datalist id="roomsList">
                  {rooms.map((room) => (
                    <option key={room} value={room} />
                  ))}
                </datalist>
                {errors.sala ? <p className="text-sm text-destructive">{errors.sala.message}</p> : null}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="kategoria">Kategoria</Label>
                  <select
                    id="kategoria"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    {...register("kategoria", { required: "Kategoria jest wymagana." })}
                  >
                    <option value="multimedia">Multimedia</option>
                    <option value="instalacje">Instalacje</option>
                    <option value="inne">Inne</option>
                  </select>
                  {errors.kategoria ? <p className="text-sm text-destructive">{errors.kategoria.message}</p> : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priorytet">Priorytet</Label>
                  <select
                    id="priorytet"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    {...register("priorytet", { required: "Priorytet jest wymagany." })}
                  >
                    <option value="niski">Niski</option>
                    <option value="wysoki">Wysoki</option>
                  </select>
                  {errors.priorytet ? <p className="text-sm text-destructive">{errors.priorytet.message}</p> : null}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="zdjecie">Zdjęcie (opcjonalnie)</Label>
                <Input
                  id="zdjecie"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleImageChange}
                />
                {imagePreview ? (
                  <div className="mt-3 rounded-lg border p-3">
                    <img src={imagePreview} alt="Podgląd zdjęcia" className="max-h-56 rounded-md object-contain" />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => {
                        setSelectedImage(null);
                        setImagePreview(null);
                        setValue("sala", "");
                        const input = document.getElementById("zdjecie") as HTMLInputElement | null;
                        if (input) {
                          input.value = "";
                        }
                      }}
                    >
                      Usuń zdjęcie
                    </Button>
                  </div>
                ) : null}
              </div>

              {submitError ? <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{submitError}</p> : null}

              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => router.push("/zgloszenia")}>
                  Anuluj
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Wysyłanie…" : "Wyślij zgłoszenie"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </RouteGuard>
  );
}
