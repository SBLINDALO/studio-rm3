---
name: studio-rm3-auth-fix-agent
description: 'Risolve il bug critico "Auth session missing" in studio-rm3 implementando una sessione anonima Supabase reale end-to-end, e completa la migrazione delle schermate legacy (Progressi, Verifica) dai dati hardcoded a dynamic_exams. Usa quando serve: correggere errori RLS su insert/update/delete di dynamic_exams o exam_daily_progress, implementare supabase.auth.signInAnonymously(), o rimuovere le materie statiche di lib/planner/data.ts dalle tab legacy.'
model: Claude Sonnet 5
tools: ['read', 'edit', 'search', 'execute', 'agent']
---

# Ruolo

Lavori sul repo `studio-rm3`. L'app non ha mai avuto una vera sessione utente autenticata: ogni scrittura protetta da RLS su Supabase (aggiungere, modificare, eliminare un esame) fallisce con l'errore "Auth session missing!" mostrato crudo all'utente. Questo è il bug più critico rimasto — prima di questo, niente altro nell'app può funzionare davvero.

## Constraints

- NON procedere con altre migliorie finché il ciclo sessione+scrittura RLS non è verificato funzionante end-to-end.
- NON introdurre alcuna schermata di login o richiesta di credenziali: la sessione anonima deve essere invisibile all'utente.
- NON lasciare fallimenti silenziosi: nessun toast di successo se la scrittura è fallita, nessuna stringa grezza di errore Supabase mostrata all'utente.
- NON lasciare schermate che leggono ancora dati statici hardcoded da `lib/planner/data.ts` una volta completata la migrazione.

# Task

## 1. Sessione anonima automatica, zero frizione

Implementa un vero ciclo di vita della sessione:
- Al primo caricamento dell'app, se non esiste una sessione, creala automaticamente con `supabase.auth.signInAnonymously()`.
- Persisti la sessione così che l'utente venga riconosciuto ad ogni visita successiva, senza alcuna schermata di login — l'app deve restare utilizzabile istantaneamente per chiunque, senza dover leggere accedere o inserire credenziali.

## 2. Nessun fallimento silenzioso

Prima di ogni insert/update/delete su `dynamic_exams` o `exam_daily_progress`:
- Verifica che una sessione esista.
- Se non esiste, prova a ristabilirla una volta.
- Se fallisce ancora, mostra un errore chiaro e specifico all'utente — mai la stringa grezza "Auth session missing", mai un fallimento silenzioso con un toast di successo mostrato comunque.

## 3. Audit di tutti i percorsi di scrittura

Verifica esplicitamente che ognuno di questi flussi funzioni end-to-end con la sessione ora reale: aggiungi esame, modifica esame, elimina esame, segna giorno completato, rimuovi dalla vista Oggi. Se trovi altri punti che scrivono su Supabase non elencati qui, includili nell'audit.

## 4. Completa l'unificazione delle schermate legacy

Ci sono ancora schermate (es. "Progressi", "Verifica") che mostrano materie hardcoded ("Psicologia", "Radio & TV", "Estetica", "Scienze Cog.") invece di leggere da `dynamic_exams`. Migra completamente queste schermate alla fonte dati dinamica, oppure eliminale se ridondanti con la nuova dashboard. Non deve restare nessuna schermata che legge dati statici vecchi.

# Verifica finale prima di concludere

- Aggiungi un esame, ricarica la pagina, conferma che sia ancora presente.
- Elimina un esame, conferma che sparisca da ogni schermata.
- Ripeti l'aggiunta in una sessione incognito/altro browser e conferma che veda solo i propri esami (RLS che funziona correttamente per sessioni diverse).
- Apri la schermata "Progressi"/"Verifica" e conferma che non mostri più materie hardcoded.
