# Zakończony etap: raporty po pracownikach i lokalizacjach

## Cel

Po zbudowaniu dashboardu aktywów i podstawowej ewidencji sprzętu, kolejnym realnym krokiem jest dodanie raportów, które pokażą:
- kto ma jakie urządzenie,
- gdzie znajduje się sprzęt,
- jaki sprzęt jest przypisany do konkretnego działu lub pomieszczenia.

## Co ma być zrobione

### 1. Raport po pracownikach
- lista pracowników z przypisanymi urządzeniami,
- liczba urządzeń na jednego pracownika,
- typy urządzeń przypisane do pracownika,
- podgląd laptopów i innych aktywów przypisanych do osób.

### 2. Raport po lokalizacjach
- który dział ma jakie urządzenia,
- które pomieszczenie zawiera jakie aktywa,
- jaki sprzęt znajduje się w recepcji / serwerowni / biurze / magazynie,
- podsumowanie urządzeń po lokalizacji.

### 3. Raport po działach
- liczba urządzeń w każdym dziale,
- typ sprzętu przypisany do działu,
- status urządzeń w działach.

### 4. Filtrowanie raportów
- wybór działu,
- wybór lokalizacji,
- wybór kategorii urządzenia,
- wybór statusu.

---

## Założenia techniczne

### Wymagane zmiany
- dodać nową ścieżkę /raporty lub podobną sekcję w aplikacji,
- przygotować zapytania SQL pod raporty po pracownikach i lokalizacjach,
- utworzyć prosty widok tabeli z wynikami,
- dodać filtry w query string.

### Przykładowe zapytania SQL
- SELECT e.person, COUNT(d.id) ... GROUP BY e.id
- SELECT l.name, COUNT(d.id) ... GROUP BY l.id
- SELECT d.department, COUNT(d.id) ... GROUP BY d.department

---

## Priorytet

To jest bardzo wartościowy etap, bo na tym poziomie system zaczyna robić realną ewidencję zasobów firmy, nie tylko zbiór wpisów.

## Wynik

Po wdrożeniu tego etapu użytkownik będzie mógł łatwo odpowiedzieć na pytania:
- kto ma jakie urządzenie,
- gdzie jest dany sprzęt,
- jaki dział ma ile aktywów,
- jakie urządzenia są przypisane do konkretnego miejsca.

## Zrealizowano

- raport pracowników z liczbą przypisanych urządzeń,
- raport lokalizacji z liczbą urządzeń,
- raport działów z liczbą urządzeń,
- filtry po dziale, lokalizacji, kategorii i statusie,
- linki z raportów do przefiltrowanej listy urządzeń,
- filtr pracownika na liście urządzeń.

## Zrealizowano dodatkowo

- dashboardowe kafelki statusów prowadzą do przefiltrowanej listy urządzeń,
- kafelki kategorii prowadzą do przefiltrowanej listy urządzeń,
- dashboardowe zestawienia kategorii i lokalizacji są klikalne.

## Następny krok

Smoke test podstawowych przepływów jest dostępny przez `npm test`. Filtrowanie aktywnych i nieaktywnych rekordów jest już dostępne. UX zostaje na końcowym etapie.
