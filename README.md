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
   git clone https://github.com/MelonSUBZERO/projekt-helpdesk.git
   cd projekt-helpdesk
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
   NEXT_PUBLIC_POCKETBASE_URL=https://baza-helpdesk.mm.zs1mm.edu.pl
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

Wdrożenie składa się z dwóch osobnych usług: aplikacji Next.js oraz PocketBase. PocketBase jest istniejącą usługą backendową. Wdrożenie frontendu nie tworzy drugiego PocketBase ani nie zmienia jego kolekcji, reguł API ani danych.

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

## Fikcyjne konta testowe

Poniższe dane są fikcyjne i przeznaczone wyłącznie do demonstracji. Aby się nimi zalogować, utwórz odpowiadające im konta w testowej instancji PocketBase i przypisz właściwe role:

| Rola | E-mail | Hasło |
| --- | --- | --- |
| Użytkownik | `test-user@gmail.com` | `useruser` |
| Technik | `test=technik@gmail.com` | `useruser` |

Nie są to dane rzeczywistych użytkowników. Nie używaj tych kont ani hasła `useruser` w środowisku produkcyjnym.

## Bezpieczeństwo i konfiguracja

- `.env.example` jest tylko wzorcem; lokalnie używaj `.env.local`.
- Nie commituj `.env.local`, produkcyjnych haseł, tokenów ani kluczy. Pliki `.env*` poza `.env.example` są ignorowane przez Git. Hasła podane w sekcji kont testowych są fikcyjnymi danymi demonstracyjnymi.
- Konto technika nie nadaje uprawnień superusera. Role i uprawnienia są egzekwowane przez PocketBase.
- Aplikacja łączy się z PocketBase bezpośrednio z przeglądarki; nie używa poświadczeń superusera.
