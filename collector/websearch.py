#!/usr/bin/env python3
"""Cerca il sito ufficiale di una gara sul web.

Strategia prudente:
1. interrogazione a DuckDuckGo con nome gara, anno e citta';
2. scarto di social, aggregatori e siti di risultati;
3. punteggio ai domini che condividono parole distintive con il titolo;
4. verifica finale: la pagina candidata deve citare il nome della gara
   (o la citta' e l'anno). Se la verifica fallisce, niente sito.
"""
import re, time, unicodedata, urllib.parse, urllib.request
from bs4 import BeautifulSoup

UA = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) RaceFinder collector"}

BLOCKLIST = (
    "facebook.", "instagram.", "twitter.", "x.com", "youtube.", "linkedin.", "tiktok.",
    "wikipedia.", "aims-worldrunning.", "fidal.", "worldathletics.", "podisti.",
    "runningcalendario.", "podistidimarta.", "runlovers.", "run4all.", "corrieredellosport.",
    "gazzetta.", "tuttosport.", "amazon.", "booking.", "tripadvisor.", "google.",
    "bing.", "duckduckgo.", "endu.net", "racesonline.", "runbritain.", "athleticsireland.",
)
STOPWORDS = {
    "maratona", "mezza", "marathon", "half", "corsa", "gara", "run", "running",
    "di", "del", "della", "dei", "delle", "de", "la", "le", "il", "lo", "da",
    "e", "ed", "a", "in", "su", "san", "santa", "citta", "di", "internazionale",
    "trofeo", "memorial", "gran", "premio", "edizione", "10k", "10km", "km",
    "the", "of", "and", "der", "die", "das", "und", "les", "des", "une",
}


def norm(text):
    text = unicodedata.normalize("NFD", text.lower())
    text = "".join(c for c in text if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]+", " ", text).strip()


def tokens(text):
    return {t for t in norm(text).split() if len(t) > 3 and t not in STOPWORDS}


def fetch(url, timeout=25):
    req = urllib.request.Request(url, headers=UA)
    return urllib.request.urlopen(req, timeout=timeout).read()


def decode_bing(href):
    """I risultati Bing passano da un redirect con la destinazione in base64."""
    import base64
    if "bing.com/ck/a" not in href:
        return href
    m = re.search(r"[?&]u=([^&]+)", href)
    if not m:
        return None
    payload = m.group(1)
    if payload.startswith("a1"):
        payload = payload[2:]
    try:
        payload += "=" * (-len(payload) % 4)
        return base64.urlsafe_b64decode(payload).decode("utf-8", "replace")
    except Exception:
        return None


def search_ddg(query, limit=6):
    url = "https://www.bing.com/search?q=" + urllib.parse.quote(query)
    soup = BeautifulSoup(fetch(url), "html.parser")
    out = []
    for a in soup.select("li.b_algo h2 a"):
        link = decode_bing(a.get("href", ""))
        if link and link.startswith("http") and "bing.com" not in link:
            out.append(link)
        if len(out) >= limit:
            break
    return out


def score(link, title_tokens):
    host = urllib.parse.urlparse(link).netloc.lower()
    if any(bad in host for bad in BLOCKLIST):
        return -1
    host_norm = norm(host.replace(".", " ").replace("-", " "))
    return sum(1 for t in title_tokens if t in host_norm)


RACE_WORDS = ("maratona", "mezza", "half marathon", "podistic", "10 km", "10k",
              "iscrizioni", "pettorale", "gara podistica", "21,0", "21.0")


def verify(url, title, city, year):
    """Accetta solo se la pagina parla davvero di quella gara:
    lessico podistico + tutte le parole distintive del titolo
    (+ citta' o anno quando il titolo ha una sola parola distintiva)."""
    try:
        html = fetch(url).decode("utf-8", "replace")[:400000]
    except Exception:
        return False
    text = norm(BeautifulSoup(html, "html.parser").get_text(" ", strip=True))
    if not any(w in text for w in RACE_WORDS):
        return False
    tt = tokens(title)
    if not tt:
        return False
    hits = sum(1 for t in tt if t in text)
    if len(tt) == 1:
        return hits == 1 and ((city and norm(city) in text) or (year and year in text))
    return hits >= len(tt) - (1 if len(tt) > 3 else 0)


def find_official_website(title, city=None, date=None, distance=None, delay=1.0):
    year = (date or "")[:4]
    kind = "mezza maratona" if distance == "half" else "10 km"
    query = " ".join(p for p in [title, kind, year, city] if p)
    try:
        links = search_ddg(query)
    except Exception as e:
        print(f"  ricerca fallita per {title}: {e}")
        return None
    tt = tokens(title)
    candidates = [(score(l, tt), l) for l in links]
    candidates = [c for c in candidates if c[0] > 0]
    candidates.sort(key=lambda c: -c[0])
    for sc, link in candidates[:2]:
        root = f"{urllib.parse.urlparse(link).scheme}://{urllib.parse.urlparse(link).netloc}/"
        if verify(root, title, city, year):
            return root
        time.sleep(delay)
    return None
