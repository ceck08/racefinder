#!/usr/bin/env python3
"""RaceFinder collector — aggiornamento quotidiano del catalogo.

Fonte attiva: calendario AIMS (gare europee di categoria mezza maratona
o con 10 km nel nome, sole edizioni con data confermata).

Regole:
- nessun doppione (id, URL fonte, nome+data);
- le schede nuove ricevono addedAt con la data del giorno;
- la citta' viene riconosciuta dal titolo usando le citta' gia' note
  nel catalogo; se non riconosciuta resta assente;
- le gare disputate da piu' di 7 giorni escono dal catalogo;
- manifestazioni con mezza e 10 km: una scheda per distanza.
"""
import json, re, sys, unicodedata, urllib.request
from datetime import date, timedelta
from pathlib import Path

from bs4 import BeautifulSoup

ROOT = Path(__file__).resolve().parent.parent
CATALOG = ROOT / "docs" / "races.json"
AIMS_URL = "https://aims-worldrunning.org/calendar.html"
TODAY = date.today().isoformat()
PRUNE_BEFORE = (date.today() - timedelta(days=7)).isoformat()

EUROPE = {
    "ITA": "Italia", "FRA": "Francia", "ESP": "Spagna", "GER": "Germania",
    "POR": "Portogallo", "GBR": "Regno Unito", "IRL": "Irlanda", "NED": "Paesi Bassi",
    "BEL": "Belgio", "SUI": "Svizzera", "AUT": "Austria", "POL": "Polonia",
    "CZE": "Cechia", "SVK": "Slovacchia", "HUN": "Ungheria", "CRO": "Croazia",
    "SLO": "Slovenia", "SRB": "Serbia", "GRE": "Grecia", "BUL": "Bulgaria",
    "ROU": "Romania", "TUR": "Turchia", "UKR": "Ucraina", "NOR": "Norvegia",
    "SWE": "Svezia", "DEN": "Danimarca", "FIN": "Finlandia", "ISL": "Islanda",
    "EST": "Estonia", "LAT": "Lettonia", "LTU": "Lituania", "MLT": "Malta",
    "CYP": "Cipro", "LUX": "Lussemburgo", "MON": "Monaco", "ALB": "Albania",
    "BIH": "Bosnia ed Erzegovina", "MKD": "Macedonia del Nord", "MNE": "Montenegro",
    "GEO": "Georgia", "ARM": "Armenia", "ISR": "Israele", "SMR": "San Marino",
}
MONTHS = {"january": 1, "february": 2, "march": 3, "april": 4, "may": 5, "june": 6,
          "july": 7, "august": 8, "september": 9, "october": 10, "november": 11, "december": 12}


def slug(text):
    text = unicodedata.normalize("NFD", text.lower())
    text = "".join(c for c in text if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]+", "-", text).strip("-")[:60]


def norm(text):
    text = unicodedata.normalize("NFD", text.lower())
    text = "".join(c for c in text if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]+", " ", text).strip()


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "RaceFinder collector (catalogo gare pubblico)"})
    return urllib.request.urlopen(req, timeout=60).read()


def parse_aims(html):
    soup = BeautifulSoup(html, "html.parser")
    races, year, month = [], None, None
    for el in soup.select(".calendar-month-header, .calendar-item"):
        if "calendar-month-header" in el.get("class", []):
            m = re.search(r"([A-Za-z]+)\s+(\d{4})", el.get_text(" ", strip=True))
            if m and m.group(1).lower() in MONTHS:
                month, year = MONTHS[m.group(1).lower()], int(m.group(2))
            continue
        date_el = el.select_one(".calendar-date")
        if not date_el or "calendar-date-ok" not in date_el.get("class", []):
            continue
        day_m = re.match(r"\s*(\d{1,2})", date_el.get_text())
        if not day_m or not year:
            continue
        link = el.select_one(".calendar-race-name a")
        code_el = el.select_one(".calendar-country-code a")
        sup = el.select_one(".calendar-supinfo")
        if not link or not code_el or not sup:
            continue
        code = code_el.get_text(strip=True)
        if code not in EUROPE:
            continue
        title = link.get_text(" ", strip=True)
        cats = sup.get_text(" ", strip=True).replace(code, "").strip()
        is_half = "H" in cats.split(",")
        is_10k = bool(re.search(r"\b10\s?k(m)?\b", title, re.I))
        if not (is_half or is_10k):
            continue
        day = int(day_m.group(1))
        race_date = f"{year:04d}-{month:02d}-{day:02d}"
        base = {"title": title, "country": EUROPE[code], "date": race_date,
                "source": link.get("href", "")}
        if is_half:
            races.append({**base, "id": f"aims-{slug(title)}-{race_date}-half", "distance": "half"})
        if is_10k:
            races.append({**base, "id": f"aims-{slug(title)}-{race_date}-10", "distance": "10"})
    return races


def guess_city(title, known_cities):
    t = norm(title)
    for city in sorted(known_cities, key=len, reverse=True):
        if re.search(rf"\b{re.escape(norm(city))}\b", t):
            return city
    return None


def main():
    races = json.loads(CATALOG.read_text())
    before = len(races)

    # 1. ritira le gare disputate da piu' di 7 giorni
    races = [r for r in races if r["date"] >= PRUNE_BEFORE]
    pruned = before - len(races)

    known_cities = {r["city"] for r in races if r.get("city")}
    ids = {r["id"] for r in races}
    sources = {r.get("source") for r in races}
    name_dates = {(norm(r["title"]), r["date"]) for r in races}

    def is_duplicate(r):
        n = norm(r["title"])
        if (n, r["date"]) in name_dates:
            return True
        # stessa gara con titolo leggermente diverso (sponsor, edizione):
        # un titolo contiene l'altro, stessa data e stesso Paese
        for (existing, d) in name_dates:
            if d == r["date"] and len(n) > 8 and len(existing) > 8 \
                    and (n in existing or existing in n):
                return True
        return False

    # 2. AIMS: aggiungi solo le novita'
    added = 0
    for r in parse_aims(fetch(AIMS_URL)):
        if r["date"] < TODAY or r["id"] in ids or r["source"] in sources or is_duplicate(r):
            continue
        city = guess_city(r["title"], known_cities)
        if city:
            r["city"] = city
            known_cities.add(city)
        r["addedAt"] = TODAY
        races.append(r)
        ids.add(r["id"])
        sources.add(r["source"])
        name_dates.add((norm(r["title"]), r["date"]))
        added += 1

    races.sort(key=lambda r: (r["date"], r["title"]))
    new_content = json.dumps(races, ensure_ascii=False, indent=1)
    old_content = CATALOG.read_text().rstrip("\n")
    if new_content != old_content:
        CATALOG.write_text(new_content + "\n")
    else:
        print("contenuto invariato")
    print(f"catalogo: {before} -> {len(races)} (aggiunte {added}, ritirate {pruned})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
