"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RegisterPage() {
  const router = useRouter();
  const { user, role, register: registerUser } = useAuth();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      router.replace(role === "technik" ? "/technik" : "/zgloszenia");
    }
  }, [role, router, user]);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<{
    email: string;
    password: string;
    confirmPassword: string;
    name: string;
  }>({
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      name: "",
    },
  });

  if (user) {
    return null;
  }

  const onSubmit = async (values: { email: string; password: string; confirmPassword: string; name: string }) => {
    setError("");
    setIsSubmitting(true);

    try {
      await registerUser(values.email, values.password, values.name);
      router.push("/zgloszenia");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Błąd rejestracji.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Rejestracja</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Imię / nazwa użytkownika</Label>
              <Input
                id="name"
                autoComplete="name"
                {...register("name", {
                  required: "Pole imię jest wymagane.",
                  minLength: { value: 2, message: "Imię musi mieć co najmniej 2 znaki." },
                  maxLength: { value: 80, message: "Imię może mieć maksymalnie 80 znaków." },
                })}
              />
              {errors.name ? <p className="text-sm text-destructive">{errors.name.message}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                {...register("email", {
                  required: "Pole e-mail jest wymagane.",
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "Wprowadź poprawny adres e-mail.",
                  },
                })}
              />
              {errors.email ? <p className="text-sm text-destructive">{errors.email.message}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Hasło</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                {...register("password", {
                  required: "Pole hasło jest wymagane.",
                  minLength: { value: 8, message: "Hasło musi mieć co najmniej 8 znaków." },
                })}
              />
              {errors.password ? <p className="text-sm text-destructive">{errors.password.message}</p> : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Powtórz hasło</Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                {...register("confirmPassword", {
                  required: "Pole powtórz hasło jest wymagane.",
                  validate: (value) => value === getValues("password") || "Hasła muszą być identyczne.",
                })}
              />
              {errors.confirmPassword ? <p className="text-sm text-destructive">{errors.confirmPassword.message}</p> : null}
            </div>

            {error ? <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p> : null}

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Rejestracja…" : "Zarejestruj się"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Masz już konto?{" "}
            <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
              Zaloguj się
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
