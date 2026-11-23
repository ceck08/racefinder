# RaceFinder

Anteprima privata del calendario per 10 km su strada e mezze maratone. Il sito statico include ricerca, filtri e preferiti salvati nel browser. Il catalogo contiene 333 schede in 29 Paesi, con date da novembre 2026 a dicembre 2027. Le gare sono ordinate per data e consultabili in gruppi di 24.

## Accesso e gestione

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
