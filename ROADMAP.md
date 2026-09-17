# Roadmap rozwoju systemu Asset Manager

## Cel

Rozbudować obecny system z narzędzia do wydawania sprzętu do pełnej ewidencji aktywów firmowych, obejmującej wszystkie urządzenia używane w firmie:

- laptopy
- monitory
- drukarki
- serwery
- switche
- routery
- UPS-y
- stacje robocze
- urządzenia sieciowe i biurowe

System ma umożliwiać:
- łatwe wyszukiwanie sprzętu,
- śledzenie lokalizacji i przypisań,
- szczegółową ewidencję urządzeń,
- szybkie zarządzanie stanem i historią.

---

## Wersja docelowa

### Funkcjonalność główna

1. Centralna karta urządzenia
   - nazwa / typ urządzenia
   - producent
   - model
   - numer seryjny
   - numer inwentarzowy
   - lokalizacja
   - dział / pomieszczenie
   - status
   - przypisanie do pracownika lub miejsca
   - data zakupu
   - gwarancja
   - właściciel / odpowiedzialny
   - notatki

2. Kategoria urządzeń
   - laptop
   - monitor
   - drukarka
   - serwer
   - switch
   - router
   - inne

3. Przypisania
   - laptop do pracownika
   - monitor do stanowiska / pomieszczenia
   - drukarka do działu / pokoju / recepcji
   - serwer / switch do lokalizacji technicznej

4. Pola dodatkowe do ewidencji
   - używany do czego
   - dla kogo / dla jakiego działu
   - w jakim pomieszczeniu
   - z jakim stanowiskiem jest powiązany
   - czy wymaga serwisu
   - czy jest aktywny

5. Wyszukiwanie i filtry
   - po typie
   - po statusie
   - po lokalizacji
   - po pracowniku
   - po numerze seryjnym
   - po modelu
   - po dziale
   - po numerze inwentarzowym

6. Historia zmian
   - kto dodał urządzenie
   - kto zmienił status
   - kto przypisał / zwrócił sprzęt
   - data i szczegóły zdarzenia

---

## Etap 1: Model danych i baza

### Cel
Rozszerzyć dane sprzętu tak, aby system obsługiwał wszystkie typy urządzeń i różne sposoby przypisania.

### Co zrobić
- dodać pełny model urządzenia do bazy SQLite,
- rozdzielić typ sprzętu od stanu i lokalizacji,
- przygotować pola wspólne dla wszystkich aktywów,
- dodać support dla przypisania do:
  - pracownika,
  - działu,
  - lokalizacji,
  - pomieszczenia,
  - stanowiska.

### Minimalne pola dla urządzenia
- id
- category
- manufacturer
- model
- serial_number
- inventory_number
- status
- location
- department
- room
- assigned_to_employee_id
- assigned_to_location
- purpose
- purchase_date
- warranty_end_date
- notes
- active
- created_at
- updated_at

### Wynik
Podstawowa struktura pozwala prowadzić ewidencję sprzętu w firmie, nie tylko laptopów.

---

## Etap 2: Rozbudowa formularza urządzenia

### Cel
Dodać pełne formularze do dodawania i edycji urządzeń.

### Co zrobić
- zmienić formularz urządzenia z prostego modelu “sprzęt pracownika” na uniwersalny formularz aktywa,
- dodać sekcje:
  - dane podstawowe,
  - lokalizacja,
  - przypisanie,
  - status,
  - notatki,
  - dane serwisowe.

### Dodatkowe pola
- typ sprzętu
- służy do / używany do
- lokalizacja techniczna
- odpowiedzialny użytkownik / dział
- numer seryjny / inwentarzowy

### Wynik
Każde urządzenie będzie mogło być dodane i opisane w jednym miejscu.

---

## Etap 3: Wyszukiwanie i filtry

### Cel
Ułatwić szybkie znajdowanie urządzeń na podstawie różnych kryteriów.

### Co zrobić
- dodać wyszukiwanie tekstowe po słowach kluczowych,
- dodać filtrowanie po:
  - typie urządzenia,
  - statusie,
  - lokalizacji,
  - dziale,
  - pracowniku,
  - aktywności,
  - sali / pomieszczeniu.
- dodać sortowanie po nazwie, dacie, lokalizacji i statusie.

### Wynik
Zamiast przeglądania wszystkich wpisów, użytkownik będzie mógł od razu znaleźć konkretne urządzenie.

---

## Etap 4: Wydawanie i zwrot sprzętu w nowym modelu

### Cel
Zachować obecne funkcje wydania sprzętu, ale rozszerzyć je na wszystkie typy aktywów.

### Co zrobić
- dla laptopów zachować model przypisania do pracownika,
- dla pozostałych urządzeń dodać przypisanie do:
  - pomieszczenia,
  - działu,
  - stanowiska,
  - lokalizacji technicznej,
  - celu użycia.
- dodać właściwe zdarzenia w historii:
  - wydano,
  - zwrócono,
  - przeniesiono,
  - zmieniono lokalizację,
  - zmieniono status,
  - wysłano do serwisu.

### Wynik
System będzie obsługiwał też sprzęt nieprzenośny, taki jak drukarki, serwery i switche.

---

## Etap 5: Historia i audyt aktywów

### Cel
Dopisać pełny zapis zmian dla każdego urządzenia.

### Co zrobić
- rozbudować tabelę historii zdarzeń,
- zapisywać:
  - kto zmienił dane,
  - co zostało zmienione,
  - kiedy,
  - jaki był poprzedni stan.
- dodać widok historii na stronie urządzenia.

### Warto monitorować
- zmiana statusu,
- przypisanie do pracownika,
- zmiana lokalizacji,
- zmiana właściciela,
- wysyłka do serwisu,
- zwrot z serwisu.

### Wynik
System staje się przejrzysty i audytowalny.

---

## Etap 6: Dodatkowe raporty i statystyki

### Cel
Umożliwić szybkie raportowanie stanu firmowego sprzętu.

### Co zrobić
- raport: liczba urządzeń w poszczególnych kategoriach,
- raport: urządzenia w użyciu / magazynie / serwisie,
- raport: sprzęt przypisany do działów,
- raport: sprzęt według lokalizacji,
- raport: przestarzałe / w gwarancji / bez przypisania.

### Wynik
Zarząd czy dział IT będzie mogło szybko ocenić stan zasobów.

---

## Etap 7: Zaawansowane funkcje późniejszego etapu

Po wdrożeniu podstaw inwentarza można dodać:
- import danych z Excela / CSV,
- eksport raportów do XLSX,
- automatyczne przypisywanie urządzeń do lokalizacji,
- powiadomienia o zakończeniu gwarancji,
- powiadomienia o stanie serwisowym,
- integrację z systemem ERP / HR,
- integrację z monitorowaniem sieci,
- pełną obsługę magazynu i ruchu urządzeń.

---

## Priorytet wdrożenia

### Priorytet P1 – od razu
- rozbudowa modelu urządzenia,
- typy sprzętu,
- lokalizacja i status,
- przypisanie do pracownika / działu,
- wyszukiwanie i filtry.

### Priorytet P2 – w kolejnej iteracji
- historia zdarzeń,
- widoki raportów,
- poprawa formularzy edycji.

### Priorytet P3 – później
- eksport / import,
- zaawansowane raportowanie,
- integracje zewnętrzne.

---

## Rekomendacja praktyczna

Najmądrze jest wdrażać to w dwóch etapach:

1. Zbudować uniwersalny model urządzenia dla całej firmy.
2. Następnie rozwinąć filtrację, raporty i historię.

To daje szybki efekt biznesowy, a jednocześnie nie rozwala istniejącego systemu.

---

## Podsumowanie

To, czego naprawdę potrzebujesz, to nie tylko „bardziej rozbudowane urządzenia”, ale pełny inwentarz aktywów firmowych z:
- typami sprzętu,
- lokalizacją,
- statusami,
- przypisaniem do pracownika lub miejsca,
- historią i wyszukiwaniem.

To jest najważniejszy kolejny krok rozwoju tego projektu.
