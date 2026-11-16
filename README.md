# Helpdesk szkolny

Aplikacja internetowa do zgłaszania usterek i obsługi ich przez techników. Frontend działa w Next.js, a dane, logowanie i pliki są obsługiwane przez istniejącą usługę PocketBase na VPS.

## Funkcje

- Rejestracja i logowanie użytkowników.
- Tworzenie zgłoszeń z kategorią, priorytetem, salą i opcjonalnym zdjęciem.
- Lista własnych zgłoszeń, szczegóły i historia zmian statusu.
- Panel technika do przeglądania, filtrowania i aktualizacji zgłoszeń.
- Dashboard z liczbą zgłoszeń otwartych i zamkniętych, kategoriami i najczęstszą salą.
- Odświeżanie listy technika w czasie rzeczywistym.
- Responsywny interfejs i jasny/ciemny motyw.

## Technologie

- Next.js 16, React, TypeScript
- Tailwind CSS
- PocketBase JavaScript SDK
- react-hook-form

## Wymagania

- Node.js 22 lub nowszy i npm.
- Dostęp sieciowy do usługi PocketBase.
- Konto PocketBase z rolą użytkownika lub technika do testowania.

## Uruchomienie lokalne

1. Sklonuj repozytorium i przejdź do katalogu projektu:

   ```bash
   git clone <URL_REPOZYTORIUM>
   cd helpdesk
   ```

2. Zainstaluj zależności:

   ```bash
   npm ci
   ```

3. Utwórz lokalny plik konfiguracji. W PowerShell:

   ```powershell
   Copy-Item .env.example .env.local
   ```

   Ustaw w `.env.local` adres bazowy PocketBase (bez `/api`):

   ```dotenv
   NEXT_PUBLIC_POCKETBASE_URL=https://adres-pocketbase.example.com
   ```

4. Uruchom aplikację:

   ```bash
   npm run dev
   ```

5. Otwórz `http://localhost:3000`.

Do sprawdzenia builda produkcyjnego:

```bash
npm run build
npm run start
```

## Wdrożenie na VPS w Coolify

PocketBase jest osobną, istniejącą usługą. Wdrożenie aplikacji nie tworzy drugiego PocketBase ani nie zmienia jego kolekcji, reguł API ani danych.

### Usługa PocketBase

- Zachowaj istniejącą usługę PocketBase i jej konfigurację.
- Użyj publicznego adresu HTTPS PocketBase jako wartości `NEXT_PUBLIC_POCKETBASE_URL`.
- Zachowaj istniejący trwały wolumen bazy `pb_data` i jego bieżący punkt montowania. Nie usuwaj ani nie zmieniaj wolumenu przy wdrażaniu frontendu.
- Usługa PocketBase musi być dostępna dla przeglądarek użytkowników aplikacji.

### Usługa aplikacji

1. W Coolify utwórz osobny zasób aplikacji z repozytorium GitHub.
2. Wybierz Dockerfile z katalogu głównego repozytorium.
3. Ustaw zmienną budowania / argument Docker:

   | Nazwa | Wartość |
   | --- | --- |
   | `NEXT_PUBLIC_POCKETBASE_URL` | Publiczny adres HTTPS istniejącej usługi PocketBase, bez `/api` |

   Next.js osadza tę wartość w klienckim buildzie, dlatego musi być dostępna już podczas `npm run build`. Nie jest to hasło ani sekret.
4. Ustaw domenę aplikacji i włącz HTTPS.
5. Ustaw port aplikacji na `3000` (Dockerfile ustawia `PORT=3000`).
6. Nie podłączaj wolumenu `pb_data` do aplikacji Next.js. Aplikacja nie przechowuje danych lokalnie i nie wymaga własnego trwałego wolumenu.

Dockerfile buduje aplikację w Node.js 22 Alpine i uruchamia wynik Next.js w trybie standalone.

## Konta testowe

Poniższe adresy są przeznaczone wyłącznie do testów i muszą odpowiadać kontom utworzonym w PocketBase:

- Użytkownik: `test-user@gmail.com`
- Technik: `test=technik@gmail.com`

Hasła nie są zapisane w repozytorium. Ustawiaj je i przekazuj poza publicznym README. Przed upublicznieniem repozytorium zmień hasła tych kont — obecne dane logowania zostały użyte podczas testów. Nie używaj tych kont ani prostych haseł w środowisku produkcyjnym.

## Bezpieczeństwo i konfiguracja

- `.env.example` jest tylko wzorcem; lokalnie używaj `.env.local`.
- Nie commituj `.env.local`, haseł, tokenów ani kluczy. Pliki `.env*` poza `.env.example` są ignorowane przez Git.
- Konto technika nie nadaje uprawnień superusera. Role i uprawnienia są egzekwowane przez PocketBase.
- Aplikacja łączy się z PocketBase bezpośrednio z przeglądarki; nie używa poświadczeń superusera.
