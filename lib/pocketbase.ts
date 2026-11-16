import PocketBase from "pocketbase";
import type { RecordModel } from "pocketbase";

export const pocketbaseUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL?.trim() ?? "";

export const pb = new PocketBase(pocketbaseUrl || "http://127.0.0.1:8090");
pb.autoCancellation(false);

export const hasPocketbaseConfig = Boolean(process.env.NEXT_PUBLIC_POCKETBASE_URL?.trim());

export type AuthUser = RecordModel & {
  name?: string;
  email?: string;
  rola?: string;
  role?: string;
};

export function getPocketbaseErrorMessage(error: unknown) {
  if (typeof error === "object" && error !== null) {
    if ("data" in error && typeof error.data === "object" && error.data !== null && "data" in error.data) {
      const fieldErrors = error.data.data;
      if (typeof fieldErrors === "object" && fieldErrors !== null) {
        const messages = Object.entries(fieldErrors).flatMap(([field, detail]) => {
          if (typeof detail === "object" && detail !== null && "message" in detail) {
            return [`${field}: ${String(detail.message)}`];
          }

          return [];
        });

        if (messages.length > 0) {
          return messages.join(" ");
        }
      }
    }

    if ("message" in error) {
      const message = String(error.message ?? "");
      if (message) {
        return message;
      }
    }
  }

  return "Wystąpił nieoczekiwany błąd.";
}
