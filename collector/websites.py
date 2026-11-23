#!/usr/bin/env python3
"""Estrae il sito ufficiale di una gara dalla sua pagina AIMS.

Cerca nella sezione «Contact details» prima un indirizzo web esplicito,
poi il dominio dell'email di contatto. Esclude social e servizi generici.
"""
import re
from bs4 import BeautifulSoup

BLOCKLIST = (
    "facebook", "instagram", "twitter", "x.com", "youtube", "linkedin", "tiktok",
    "marathon-photos", "runnetglobal", "hiracers", "todotrofeo", "aims-worldrunning",
    "google", "whatsapp", "strava",
)
FREE_MAIL = ("gmail.", "hotmail.", "outlook.", "yahoo.", "libero.", "virgilio.",
             "icloud.", "live.", "msn.", "aol.", "tiscali.", "proton.")

URL_RE = re.compile(r"(?:https?://)?(?:www\.)[\w.-]+\.[a-z]{2,}(?:/[\w./-]*)?", re.I)
MAIL_RE = re.compile(r"[\w.+-]+@([\w-]+\.[\w.]+)")


def extract_website(html):
    soup = BeautifulSoup(html, "html.parser")
    marker = soup.find(string=re.compile(r"Contact details", re.I))
    if not marker:
        return None
    block = marker.parent.find_parent()
    if not block:
        return None
    text = block.get_text(" ", strip=True)
    for candidate in URL_RE.findall(text):
        if not any(bad in candidate.lower() for bad in BLOCKLIST):
            return "https://" + candidate.lstrip("/").removeprefix("http://").removeprefix("https://")
    mail = MAIL_RE.search(text)
    if mail:
        domain = mail.group(1).lower()
        if not any(free in domain for free in FREE_MAIL):
            return "https://www." + domain if not domain.startswith("www.") else "https://" + domain
    return None
