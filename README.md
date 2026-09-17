# Asset Manager – system zarządzania sprzętem firmowym

Aplikacja webowa (Node.js) do zarządzania sprzętem: kartoteka urządzeń z pełną
specyfikacją, historia przypisań, protokoły wydania/zdania z podpisem
elektronicznym (tablet), generowanie PDF i automatyczna wysyłka mailem.
Dane trzymane lokalnie w bazie SQLite – działa offline, na jednym komputerze
w firmowej sieci.

## Funkcje

- Kartoteka urządzeń: Device, Serial NR/Service Tag, Device Type, Domena,
  Computer Name, ERP, VNC, VPN, AnyDesk, MAC, Data zakupu, status
  (dostępny / wydany / serwis / zezłomowany)
- Kartoteka pracowników: Person, Department, Line, Info, e-mail
- Protokół wydania i zdania sprzętu z **podpisem odręcznym** (działa dotykiem
  na tablecie) – podpis pracownika i podpis wydającego/odbierającego
- Automatyczne generowanie **PDF** protokołu z podpisami
- Automatyczna **wysyłka PDF mailem** (własne SMTP – Office365, Gmail, itd.)
- Po zdaniu sprzętu urządzenie **automatycznie wraca na stan „dostępny”**
- Pełna historia zdarzeń każdego urządzenia i każdego pracownika
- Logowanie z rolami: **administrator** (zarządza kontami) i **użytkownik**
  (IT/HR – obsługuje wydania/zdania)

## Wymagania

- Komputer/serwer w firmie z zainstalowanym **Node.js** w wersji 18 lub nowszej
  (pobierz z https://nodejs.org – wersja LTS)
- Dostęp do internetu tylko przy pierwszej instalacji (pobranie pakietów) oraz
  do wysyłki maili przez SMTP

## Instalacja (pierwsze uruchomienie)

1. Rozpakuj folder `asset-manager` na dysku (np. `C:\asset-manager` lub
   `/opt/asset-manager`).
2. Otwórz terminal / wiersz poleceń w tym folderze.
3. Zainstaluj zależności:

   ```
   npm install
   ```

4. Skopiuj plik `.env.example` do `.env` i uzupełnij dane:

   ```
   cp .env.example .env      (Linux/Mac)
   copy .env.example .env    (Windows)
   ```

   W pliku `.env` uzupełnij:
   - `COMPANY_NAME` – nazwa firmy widoczna na protokołach
   - `SESSION_SECRET` – dowolny losowy ciąg znaków
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` – dane logowania do
     firmowej poczty (np. dla Office365: `smtp.office365.com`, port `587`).
     Jeśli używacie Gmaila, trzeba wygenerować „hasło aplikacji” w ustawieniach
     konta Google – zwykłe hasło nie zadziała.

5. Zainicjuj bazę danych (tworzy strukturę i konto administratora):

   ```
   npm run seed
   ```

   Wypisze się domyślne konto: **login: admin / hasło: admin123**
   (koniecznie zmień je po pierwszym zalogowaniu – dodaj nowe konto z panelu
   „Użytkownicy” i zablokuj/usuń stare, lub zmień sobie hasło bezpośrednio
   w bazie).

6. Uruchom aplikację:

   ```
   npm start
   ```

7. Otwórz w przeglądarce: `http://localhost:3000` (na tym samym komputerze)
   lub `http://ADRES_IP_KOMPUTERA:3000` z innych stanowisk w sieci firmowej
   (upewnij się, że port 3000 jest dopuszczony w zaporze sieciowej Windows).

## Codzienne uruchamianie

Wystarczy w folderze aplikacji wpisać `npm start` (lub skonfigurować to jako
usługę Windows / systemd, żeby uruchamiało się automatycznie po starcie
komputera – mogę to przygotować, jeśli będzie potrzebne).

## Jak korzystać

- **Wydanie sprzętu**: menu „+ Wydanie” → wybierz pracownika i urządzenie
  (tylko dostępne są na liście) → osoby podpisują się w polach podpisu
  (najlepiej na tablecie) → zapisz. System wygeneruje PDF, wyśle go mailem
  (jeśli zaznaczona opcja) i zmieni status urządzenia na „wydany”.
- **Zdanie sprzętu**: menu „+ Zdanie” → wybierz aktywne przypisanie → podpisy
  → zapisz. Urządzenie automatycznie wraca na stan „dostępny”.
- **Historia**: karta każdego urządzenia i pracownika pokazuje pełną historię
  wydań/zdań oraz dziennik zdarzeń.
- **Protokoły**: zakładka „Protokoły” to lista wszystkich wygenerowanych
  dokumentów z możliwością podglądu PDF i ponownej wysyłki maila.

## Kopie zapasowe

Cała baza danych to jeden plik: `data/asset-manager.db`. Wystarczy go
regularnie kopiować (np. codziennie w nocy) w bezpieczne miejsce (dysk
sieciowy, chmura firmowa). Wygenerowane PDF-y protokołów leżą w
`storage/protocols/`.

## Bezpieczeństwo

- Plik `.env` zawiera hasło do poczty – nie udostępniaj go, nie wrzucaj do
  publicznych repozytoriów.
- Zmień domyślne hasło administratora zaraz po instalacji.
- Aplikacja jest przygotowana do pracy w sieci lokalnej firmy; do wystawienia
  jej w internecie potrzebne byłoby dodatkowe zabezpieczenie (HTTPS, itp.) –
  daj znać, jeśli będzie taka potrzeba.

## Rozbudowa

Jeśli w przyszłości będziecie potrzebować dostępu z wielu lokalizacji przez
internet, logowania pracowników do podglądu własnego sprzętu, importu danych
z obecnego arkusza Google Sheets, czy raportów/eksportu do Excela – to
wszystko da się dobudować na tym fundamencie. Daj znać, co przyda się w
pierwszej kolejności.
