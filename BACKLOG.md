# Backlog wdrożenia rozbudowy Asset Manager

## Cel produktu

Rozbudować system z prostego zarządzania wydaniem sprzętu do pełnej ewidencji aktywów firmowych obejmującej wszystkie urządzenia w firmie:

- laptopy
- monitory
- drukarki
- serwery
- switche
- routery
- UPS-y
- stacje robocze
- inne urządzenia biurowe i sieciowe

---

## Epic 1: Model danych i baza

### 1.1. Rozszerzenie tabeli devices
- [x] dodać pole category_id
- [x] dodać pole manufacturer
- [x] dodać pole model
- [x] dodać pole inventory_number
- [x] dodać pole location_id
- [x] dodać pole department
- [x] dodać pole room
- [x] dodać pole assigned_to_employee_id
- [x] dodać pole assigned_to_location
- [x] dodać pole purpose
- [x] dodać pole warranty_end_date
- [x] dodać pole notes
- [x] dodać pole active
- [x] dodać pole created_at
- [x] dodać pole updated_at

### 1.2. Dodanie tabeli categories
- [x] utworzyć tabelę device_categories
- [x] dodać wartości: laptop, monitor, drukarka, serwer, switch, router, inne
- [x] podłączyć relację do devices.category_id

### 1.3. Dodanie tabeli locations
- [x] utworzyć tabelę locations
- [x] dodać pola: name, type, parent_id, department
- [x] obsłużyć lokalizacje: biuro, sala, serwerownia, recepcja, magazyn

### 1.4. Dodanie tabeli assignments
- [x] utworzyć tabelę assignments
- [x] dodać pola: device_id, employee_id, data_wydania, data_zdania, status
- [x] obsłużyć przypisanie do pracownika oraz do miejsca

### 1.5. Dodanie tabeli device_history
- [x] rozszerzyć istniejący model historii o typ zdarzenia
- [x] dodać zdarzenia typu utworzono, edycja, zmiana_statusu, przypisanie, lokalizacja

### 1.6. Migracja danych istniejących
- [x] zadbać o kompatybilność z istniejącymi rekordami urządzeń
- [x] dodać brakujące pola w tabeli
- [x] sprawdzić poprawność struktury bazy

---

## Epic 2: Formularze urządzeń

### 2.1. Ujednolicenie formularza urządzenia
- [x] zmienić prosty formularz z danymi podstawowymi na uniwersalny formularz aktywa
- [x] dodać sekcję Dane podstawowe
- [x] dodać sekcję Lokalizacja
- [x] dodać sekcję Przypisanie
- [x] dodać sekcję Status
- [x] dodać sekcję Notatki

### 2.2. Dodanie pól do formularza
- [x] typ urządzenia
- [x] producent
- [x] model
- [x] numer seryjny
- [x] numer inwentarzowy
- [x] lokalizacja
- [x] dział
- [x] pomieszczenie
- [x] przypisanie do pracownika
- [x] przypisanie do stanowiska / miejsca
- [x] cel użytkowania
- [x] data zakupu
- [x] data gwarancji
- [x] status

### 2.3. Obsługa edycji
- [x] umożliwić edycję wszystkich pól
- [ ] dodać walidację wymaganych pól
- [ ] dodać komunikat potwierdzający zapis

### 2.4. Obsługa usuwania / deaktywacji
- [ ] dodać pełne oznaczenie nieaktywnych urządzeń
- [ ] dodać widok urządzeń wycofanych/nieaktywne

---

## Epic 3: Wyszukiwanie i filtrowanie

### 3.1. Wyszukiwarka tekstowa
- [x] dodać pole search na liście urządzeń
- [x] wyszukiwanie po: model, producent, numer seryjny, numer inwentarzowy, lokalizacja

### 3.2. Filtry
- [x] filtr po typie urządzenia / kategorii
- [x] filtr po statusie
- [x] filtr po lokalizacji
- [x] filtr po dziale
- [x] filtr po pracowniku
- [ ] filtr po pomieszczeniu
- [x] filtr po aktywnych / nieaktywnych

### 3.3. Sortowanie
- [ ] sortowanie po nazwie
- [ ] sortowanie po dacie zakupu
- [ ] sortowanie po lokalizacji
- [ ] sortowanie po statusie

### 3.4. Widok listy urządzeń
- [x] dodać kolumny: kategoria, typ, lokalizacja, status, dział
- [x] dodać szybkie linki do szczegółów

---

## Epic 4: Przypisania i wydania urządzeń

### 4.1. Rozdzielenie logiki dla laptopów i pozostałych urządzeń
- [x] laptop = przypisanie do pracownika
- [x] monitor = przypisanie do stanowiska / pomieszczenia
- [x] drukarka = przypisanie do działu / miejsca pracy
- [x] serwer / switch = przypisanie do lokalizacji technicznej

### 4.2. Funkcjonalność wydania
- [x] wydanie urządzenia do pracownika
- [x] wydanie urządzenia do lokalizacji
- [x] zapis daty wydania
- [ ] zapis odpowiedzialnej osoby

### 4.3. Funkcjonalność zwrotu
- [x] zwrot urządzenia z pracownika
- [x] zwrot urządzenia z lokalizacji
- [x] automatyczna zmiana statusu na dostępny / magazyn
- [x] przeniesienie urządzenia do statusu utylizacja

### 4.4. Historia przypisań
- [x] zapisywać każdą zmianę przypisania
- [x] zachować dane kto i kiedy przeniósł urządzenie

---

## Epic 5: Historia i audyt

### 5.1. Rozszerzenie tabeli event log
- [x] dodać typ zdarzenia
- [x] dodać opis zmiany
- [x] dodać użytkownika wykonującego zmianę

### 5.2. Zdarzenia do obsługi
- [x] utworzono urządzenie
- [x] zaktualizowano dane
- [x] zmieniono status
- [x] przypisano do pracownika
- [x] przypisano do lokalizacji
- [x] zwrócono urządzenie
- [x] wycofano urządzenie do utylizacji
- [ ] wysłano do serwisu
- [ ] przywrócono do użycia

### 5.3. Widok historii urządzenia
- [x] na stronie szczegółów dodać sekcję historii zdarzeń
- [x] wyświetlać datę, zdarzenie i opis

---

## Epic 6: Raporty i statystyki

### 6.1. Dashboard aktywów
- [x] liczba urządzeń w każdym typie
- [x] liczba urządzeń w użyciu
- [x] liczba urządzeń w magazynie
- [x] liczba urządzeń w serwisie
- [ ] liczba urządzeń przypisanych do działów
- [x] kliknięcie w status prowadzi do przefiltrowanej listy urządzeń
- [x] kliknięcie w kategorię prowadzi do przefiltrowanej listy urządzeń
- [x] kliknięcie w lokalizację prowadzi do przefiltrowanej listy urządzeń

### 6.2. Raport według lokalizacji
- [x] liczba urządzeń wg lokalizacji
- [x] podgląd wszystkich aktywów w konkretnej lokalizacji

### 6.5. Raporty operacyjne
- [x] raport urządzeń przypisanych do pracowników
- [x] raport urządzeń według działów
- [x] filtrowanie raportów po dziale, lokalizacji, kategorii i statusie
- [x] linki z raportów do przefiltrowanej listy urządzeń

### 6.3. Raport według statusów
- [x] dostępne
- [x] wydane
- [x] serwis
- [ ] magazyn
- [ ] nieaktywne

### 6.4. Raporty eksportowe
- [ ] eksport do CSV
- [ ] eksport do XLSX
- [ ] podgląd PDF raportu

---

## Epic 7: UX i UAT

### 7.1. Testy użyteczności
- [ ] sprawdzić dodawanie urządzeń różnych typów
- [ ] sprawdzić przypisanie pracownikowi i lokalizacji
- [ ] sprawdzić wyszukiwanie i filtrowanie
- [ ] sprawdzić historię urządzenia

### 7.2. Testy błędów
- [x] smoke test przepływu dodanie -> przypisanie -> zwrot -> utylizacja -> deaktywacja
- [ ] brakujące pola przy dodawaniu
- [ ] brakujące relacje przy edycji
- [ ] błędne statusy przy zwrocie
- [ ] błędne raporty po migracji danych

### 7.3. Weryfikacja biznesowa
- [ ] sprawdzić, czy laptopy są widoczne dla pracownika
- [ ] sprawdzić, czy serwery i switche są widoczne z perspektywy lokalizacji
- [ ] sprawdzić, czy dane są wystarczające do audytu

---

## Priorytet wdrożenia

### P1 - zrobione / obecnie gotowe
- model danych i baza
- typy urządzeń
- lokalizacje i statusy
- przypisania
- wyszukiwanie i filtrowanie
- dashboard aktywów
- historia zdarzeń

### P2 - kolejna iteracja
- raport po pracownikach
- raport po lokalizacjach / działach
- podgląd urządzeń według miejsca przypisania
- sortowanie i finalne filtry listy urządzeń
- poprawa walidacji i deaktywacji urządzeń

### P3 - później
- import/eksport danych
- zaawansowane raportowanie
- integracje zewnętrzne

---

## Zależności techniczne

### Moduły wymagające zmiany
- [server.js](server.js)
- [routes/devices.js](routes/devices.js)
- [db/database.js](db/database.js)
- [db/init.js](db/init.js)
- [views/devices](views/devices)
- [public/js](public/js)

### Obszary do dodania
- nowy widok listy aktywów
- nowy widok szczegółowy urządzenia
- nowa logika przypisania
- nowy panel filtrowania

---

## Wynik oczekiwany po wdrożeniu

Po zakończeniu etapu 1-4 system będzie pozwalał na:
- ewidencję wszystkich urządzeń firmy,
- łatwe wyszukiwanie i filtrowanie,
- przypisanie laptopów do pracowników,
- przypisanie pozostałych urządzeń do miejsca / działu / lokalizacji,
- śledzenie historii i zmian statusów.

To daje realną wartość biznesową i pozwala przekształcić projekt w system inwentarzowy, a nie tylko narzędzie do wydawania sprzętu.
