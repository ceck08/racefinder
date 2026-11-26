# RaceFinder

[![Controllo sintassi Python](https://github.com/ceck08/racefinder/actions/workflows/python-syntax.yml/badge.svg)](https://github.com/ceck08/racefinder/actions/workflows/python-syntax.yml)
[![Aggiornamento catalogo](https://github.com/ceck08/racefinder/actions/workflows/collect.yml/badge.svg)](https://github.com/ceck08/racefinder/actions/workflows/collect.yml)

Anteprima privata del calendario per 10 km su strada e mezze maratone. Il sito statico include ricerca, filtri e preferiti salvati nel browser. Il catalogo contiene 362 schede in 29 Paesi, con date da novembre 2026 a dicembre 2027. Le gare sono ordinate per data e consultabili in gruppi di 24. Oltre all'elenco sono disponibili una vista calendario mensile, il filtro delle novità degli ultimi 30 giorni e l'esportazione di ogni gara nel calendario personale in formato iCalendar.

## Sito pubblico

RaceFinder è pubblicato su GitHub Pages: [ceck08.github.io/racefinder](https://ceck08.github.io/racefinder/). Il sito è statico e non richiede registrazione. Il codice e il catalogo sono nel repository [ceck08/racefinder](https://github.com/ceck08/racefinder).

### Installazione come app (PWA)

RaceFinder è una web app installabile: da iPhone «Aggiungi a Home» in Safari, da Android «Installa app» nel browser, da PC l'icona di installazione nella barra degli indirizzi. L'interfaccia è ottimizzata per smartphone (filtri richiudibili, una colonna), tablet (due colonne) e PC (fino a quattro colonne oltre i 1400 px). Il catalogo resta consultabile anche offline dopo la prima visita; alla riapertura si aggiorna da solo.

### Aggiornamento automatico

Un workflow GitHub Actions (`.github/workflows/collect.yml`) esegue `collector/collect.py` ogni giorno alle 06:47 circa (ora italiana) e su richiesta manuale. Il collector rilegge il calendario AIMS, aggiunge le gare nuove marcandole con `addedAt`, ritira quelle disputate da oltre 7 giorni ed evita i doppioni anche quando il titolo differisce per sponsor o edizione. Se il catalogo non cambia, non viene creato nessun commit. Ogni push ripubblica il sito automaticamente.

### Siti ufficiali delle gare

Ogni scheda mostra il link «Sito ufficiale» per iscriversi sul sito dell'organizzatore (campo `website`) e, quando disponibile, la «Pagina Facebook» della gara o dell'organizzatore (campo `facebook`). Per le gare AIMS il sito viene estratto automaticamente dal collector; per le altre fonti un'attività pianificata giornaliera su Kimi cerca sul web sito ufficiale e pagina Facebook (massimo 25 gare al giorno, con verifica delle fonti ed esclusione di aggregatori e portali terzi, fatta eccezione per endu.net quando è la pagina ufficiale di iscrizione), aggiorna `docs/races.json` e pubblica la modifica con un commit dedicato. Le gare senza riferimenti individuabili restano senza link anziché rimandare a portali generici.

## Accesso e gestione (anteprima locale)

Su Ubuntu il sito risponde su [127.0.0.1:8780](http://127.0.0.1:8780/). Da un altro computer con accesso SSH a Ubuntu, aprire un tunnel e lasciare il terminale aperto durante la consultazione.

```sh
ssh -NT -o ExitOnForwardFailure=yes -L 127.0.0.1:8780:127.0.0.1:8780 fabio@192.168.3.199
```

Poi aprire lo stesso URL nel browser. Il proxy esistente e il Raspberry Pi non intervengono.

Da questa directory, `docker compose up -d --pull never` avvia l'anteprima e `docker compose stop` la ferma. Il servizio locale usa un container senza privilegi, una rete dedicata, file montati in sola lettura e limiti di CPU, memoria, processi e dimensione dei log. L'anteprima non necessita di database né di servizi remoti a runtime.

## Predisposizione pubblicitaria

La vista del catalogo riserva come punti di integrazione il confine fra filtri e risultati per un eventuale banner responsivo e l'interno della griglia per eventuali gare sponsorizzate. Filtri, conteggi e preferiti operano sulle gare effettive. L'anteprima non monta elementi pubblicitari. La policy del server consente script soltanto dall'origine locale. L'attivazione futura richiede una scelta esplicita di formati e provider.

## Censimento iniziale delle fonti

Controllo del 23 novembre 2026. Le fonti seguenti sono candidate per l'inventario, con accesso ai contenuti verificato manualmente. Per ciascuna restano da verificare le condizioni di accesso automatizzato e riutilizzo. Nessuna è collegata a un collector.

| Fonte | Perimetro e formato | Dati osservati e limiti |
|---|---|---|
| [FIDAL](https://www.fidal.it/calendario.php) | Italia, calendario federale HTML | Data, titolo, località e tipo di gara. Controllare la distanza nelle schede o nei regolamenti. |
| [Fédération Française d’Athlétisme](https://www.athle.fr/contenu/tout-le-calendrier-2027/5255) | Francia, calendario federale con sezione Running | Punto di ingresso per il calendario nazionale. I calendari locali, come [quello di Parigi](https://comitedeparis.athle.fr/asp.net/espaces.html/html.aspx?id=11353), aggiungono date, label e riferimenti agli organizzatori. |
| [World Athletics](https://worldathletics.org/competition/calendar-results?disciplineId=2) | Internazionale, calendario HTML di corsa su strada | Data, competizione, luogo, Paese e categoria. Copre le gare comunicate alla federazione internazionale e spesso richiede di ricavare la distanza dal titolo o dalla scheda ufficiale. |
| [AIMS](https://aims-worldrunning.org/calendar.html) | Internazionale, calendario HTML e feed iCalendar pubblicizzato | Date, nomi, Paesi e categorie. «H» identifica le mezze, mentre «R» include più distanze. Il calendario è limitato alle gare dei membri. Verificare i campi effettivi del feed prima di integrarlo. |
| [SCC Events](https://www.scc-events.com/en/events/calendar) e RunCzech | Germania e Cechia, calendari degli organizzatori | Schede per edizione, data, località e collegamenti alle iscrizioni, con più tipi di competizione da distinguere. |
| [Valencia Ciudad del Running](https://www.valenciaciudaddelrunning.com/en/evento/10k-valencia/) e siti degli organizzatori | Spagna, Italia, Portogallo, Germania e Cechia nel campione | Le pagine di gara e i regolamenti consentono il controllo puntuale delle singole edizioni. Le fonti delle singole schede sono in [races.json](dist/races.json). |

Il campione conferma che si possono raccogliere a mano data, città, distanza e fonte ufficiale da siti diversi. Lo stato delle iscrizioni cambia nel tempo e non è mostrato nelle schede. Per esempio, la [FAQ della 10K di Valencia](https://10kvalencia.com/en/faq/) indicava che i pettorali per la 10 km erano esauriti. La categoria 10 km include gare su strada tra 9 e 11 km, estremi inclusi. La scheda mostra la distanza dichiarata dall’organizzatore. Per esempio, la [Salso–Fidenza della Verdi Marathon](https://www.verdimarathon.it/10k/) rientra nella categoria e indica 9,6 km effettivi. Le fonti verificate sono un punto di partenza. La copertura effettiva di tutti i Paesi europei è ancora da censire.


## Ampliamento del catalogo

Controllo del 23 novembre 2026. Estrazione una tantum dei dati essenziali dai calendari pubblici, con aggiunte da singole pagine degli organizzatori. Una manifestazione con entrambe le distanze ha una scheda per ciascuna gara. I calendari possono cambiare e la presenza di una scheda non indica che le iscrizioni siano aperte. La città compare quando è disponibile o identificabile dalla fonte.

| Provenienza | Schede aggiunte |
|---|---:|
| [FIDAL, calendario nazionale mezze maratone 2027](https://casaitaliana.fidal.it/content/Maratone-e-mezze-219-eventi-nel-2027/186849) | 175 |
| [FIDAL Piemonte, calendario regionale 2027](https://www.fidal.it/upload/Piemonte/Calendari%20Regionali/2026%2010%2023%20Torino%20LENZUOLONE%202027%20ordine%20data.pdf) | 44 |
| [Athletics Malta, calendario strada 2027](https://athleticsmalta.com/wp-content/uploads/2026/10/2027-Road-Running-Calendar-FINAL-1.pdf) | 23 |
| [AIMS, calendario internazionale dei membri](https://aims-worldrunning.org/calendar.html) | 60 |
| SuperHalfs, RunCzech, Great Run, Dublin Marathon, Time to e altri organizzatori | 23 |

Le nuove schede affiancano le 8 del campione iniziale. Dal calendario AIMS sono state prese le mezze esplicitamente classificate come tali e le 10 km esplicitate nel nome, per le date singole riportate e le edizioni europee selezionate. Il calendario federale italiano resta soggetto a variazioni.

## Ampliamento del 23 novembre 2026 (seconda sessione)

Aggiunte **29 schede** dal [calendario AIMS](https://aims-worldrunning.org/calendar.html) (categorie «H» e 10 km nel nome, sole edizioni europee con data confermata), portando il catalogo da 333 a 362 gare. Le gare già presenti da altre fonti (10K Valencia, Malta Marathon, EDP Lisbon Half, Generali Prague e Berlin Half, Maratonina di Udine) non sono state duplicate; le edizioni già disputate sono state escluse. Le manifestazioni con mezza e 10 km (Gerusalemme, Paavo Nurmi, Tallinn) hanno una scheda per distanza. Le schede nuove riportano il campo `addedAt` e compaiono nel filtro «Novità» per 30 giorni.

### Fonti esaminate e non ancora integrate

| Fonte | Esito della verifica |
|---|---|
| [Athletics Ireland](https://www.athleticsireland.ie/events/calendar) | API WordPress raggiungibile (1033 fixture), ma data e luogo degli eventi non sono esposti: richiede lettura delle singole pagine. |
| [runbritain](https://www.runbritain.com/races) | Ricerca gare interamente in JavaScript senza endpoint dati individuato. |
| [World Athletics](https://worldathletics.org/competition/calendar-results?disciplineId=2) | Dati incorporati nella pagina (100 eventi per vista); il filtro Europa non risponde con i parametri provati. |
| [Fédération Française d'Athlétisme](https://www.athle.fr/contenu/tout-le-calendrier-2027/5255) | Calendario 2027 in PDF, in gran parte pista; i calendari running restano sui siti dei comitati regionali. |
| [FIDAL, calendario online](https://www.fidal.it/calendario.php) | La ricerca per tipo «Strada» richiede una sessione interattiva; i calendari PDF regionali restano la via pratica. |

### Mappa geografica

Rinviata: le schede non hanno coordinate. Richiede la geocodifica delle località (da fare una tantum con archivio locale) prima di integrare OpenStreetMap.
