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
- [ ] dodać pole category
- [ ] dodać pole manufacturer
- [ ] dodać pole model
- [ ] dodać pole inventory_number
- [ ] dodać pole location
- [ ] dodać pole department
- [ ] dodać pole room
- [ ] dodać pole assigned_to_employee_id
- [ ] dodać pole assigned_to_location
- [ ] dodać pole purpose
- [ ] dodać pole purchase_date
- [ ] dodać pole warranty_end_date
- [ ] dodać pole notes
- [ ] dodać pole active
- [ ] dodać pole created_at
- [ ] dodać pole updated_at

### 1.2. Dodanie tabeli categories
- [ ] utworzyć tabelę device_categories
- [ ] dodać wartości: laptop, monitor, drukarka, serwer, switch, router, inne
- [ ] podłączyć relację do devices.category_id

### 1.3. Dodanie tabeli locations
- [ ] utworzyć tabelę locations
- [ ] dodać pola: name, type, parent_id, department
- [ ] obsłużyć lokalizacje: biuro, sala, serwerownia, recepcja, magazyn

### 1.4. Dodanie tabeli assignments
- [ ] utworzyć tabelę device_assignments
- [ ] dodać pola: device_id, employee_id, assigned_from, assigned_to, assignment_type, notes
- [ ] obsłużyć przypisanie do pracownika oraz do miejsca

### 1.5. Dodanie tabeli device_history
- [ ] rozszerzyć istniejący model historii o typ zdarzenia
- [ ] dodać status change, assignment change, location move, service event

### 1.6. Migracja danych istniejących
- [ ] zadbać o kompatybilność z istniejącymi rekordami urządzeń
- [ ] przenieść obecne pola do nowego modelu
- [ ] sprawdzić brakujące dane w istniejących wpisach

---

## Epic 2: Formularze urządzeń

### 2.1. Ujednolicenie formularza urządzenia
- [ ] zmienić prosty formularz z danymi podstawowymi na uniwersalny formularz aktywa
- [ ] dodać sekcję Dane podstawowe
- [ ] dodać sekcję Lokalizacja
- [ ] dodać sekcję Przypisanie
- [ ] dodać sekcję Status
- [ ] dodać sekcję Notatki

### 2.2. Dodanie pól do formularza
- [ ] typ urządzenia
- [ ] producent
- [ ] model
- [ ] numer seryjny
- [ ] numer inwentarzowy
- [ ] lokalizacja
- [ ] dział
- [ ] pomieszczenie
- [ ] przypisanie do pracownika
- [ ] przypisanie do stanowiska
- [ ] cel użytkowania
- [ ] data zakupu
- [ ] data gwarancji
- [ ] status

### 2.3. Obsługa edycji
- [ ] umożliwić edycję wszystkich pól
- [ ] dodać walidację wymaganych pól
- [ ] dodać komunikat potwierdzający zapis

### 2.4. Obsługa usuwania / deaktywacji
- [ ] dodać pełne oznaczenie nieaktywnych urządzeń
- [ ] dodać widok urządzeń wycofanych/nieaktywne

---

## Epic 3: Wyszukiwanie i filtrowanie

### 3.1. Wyszukiwarka tekstowa
- [ ] dodać pole search na liście urządzeń
- [ ] wyszukiwanie po: model, producent, numer seryjny, numer inwentarzowy, lokalizacja

### 3.2. Filtry
- [ ] filtr po typie urządzenia
- [ ] filtr po statusie
- [ ] filtr po lokalizacji
- [ ] filtr po dziale
- [ ] filtr po pracowniku
- [ ] filtr po pomieszczeniu
- [ ] filtr po aktywnych / nieaktywnych

### 3.3. Sortowanie
- [ ] sortowanie po nazwie
- [ ] sortowanie po dacie zakupu
- [ ] sortowanie po lokalizacji
- [ ] sortowanie po statusie

### 3.4. Widok listy urządzeń
- [ ] dodać kolumny: typ, nazwa, lokalizacja, status, pracownik / dział
- [ ] dodać szybkie linki do szczegółów

---

## Epic 4: Przypisania i wydania urządzeń

### 4.1. Rozdzielenie logiki dla laptopów i pozostałych urządzeń
- [ ] laptop = przypisanie do pracownika
- [ ] monitor = przypisanie do stanowiska / pomieszczenia
- [ ] drukarka = przypisanie do działu / miejsca pracy
- [ ] serwer / switch = przypisanie do lokalizacji technicznej

### 4.2. Funkcjonalność wydania
- [ ] wydanie urządzenia do pracownika
- [ ] wydanie urządzenia do lokalizacji
- [ ] zapis daty wydania
- [ ] zapis odpowiedzialnej osoby

### 4.3. Funkcjonalność zwrotu
- [ ] zwrot urządzenia z pracownika
- [ ] zwrot urządzenia z lokalizacji
- [ ] automatyczna zmiana statusu na dostępny / magazyn

### 4.4. Historia przypisań
- [ ] zapisywać każdą zmianę przypisania
- [ ] zachować dane kto i kiedy przeniósł urządzenie

---

## Epic 5: Historia i audyt

### 5.1. Rozszerzenie tabeli event log
- [ ] dodać typ zdarzenia
- [ ] dodać źródło zdarzenia
- [ ] dodać opis zmiany
- [ ] dodać użytkownika wykonującego zmianę

### 5.2. Zdarzenia do obsługi
- [ ] utworzono urządzenie
- [ ] zaktualizowano dane
- [ ] zmieniono status
- [ ] przypisano do pracownika
- [ ] przypisano do lokalizacji
- [ ] zwrócono urządzenie
- [ ] wysłano do serwisu
- [ ] przywrócono do użycia

### 5.3. Widok historii urządzenia
- [ ] na stronie szczegółów dodać sekcję timeline
- [ ] wyświetlać datę, typ zdarzenia i opis

---

## Epic 6: Raporty i statystyki

### 6.1. Dashboard aktywów
- [ ] liczba urządzeń w każdym typie
- [ ] liczba urządzeń w użyciu
- [ ] liczba urządzeń w magazynie
- [ ] liczba urządzeń w serwisie
- [ ] liczba urządzeń przypisanych do działów

### 6.2. Raport według lokalizacji
- [ ] liczba urządzeń wg biura / sali / działu
- [ ] podgląd wszystkich aktywów w konkretnej lokalizacji

### 6.3. Raport według statusów
- [ ] dostępne
- [ ] wydane
- [ ] serwis
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

### P1 - natychmiastowo
- model danych i baza
- typy urządzeń
- lokalizacje i statusy
- przypisania
- wyszukiwanie i filtrowanie

### P2 - kolejna iteracja
- historia zdarzeń
- formularze edycji urządzenia
- raporty podstawowe

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
