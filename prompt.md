# Prompturile care au construit extensia

Istoricul cererilor, in ordine cronologica, exact asa cum au fost formulate. Fiecare
are dedesubt o nota scurta despre ce a rezultat din ea.

---

## 1. Cererea initiala

> fa-mi o extensie de vs code care inchide tagurile de freemarker atunci cand ajung la > cand le scriu

Scheletul extensiei: TypeScript, logica pura separata in `src/freemarker.ts`,
integrarea cu VS Code in `src/extension.ts`, teste in `test/`.

> intreaba-ma daca e ceva neclar

> fa-mi si instructiuni cum o pot instala la mine

`README.md` cu instalare prin `.vsix`, prin copiere directa si prin `F5`.

> poti sa te inspiri si din https://github.com/AnglusWang/freemarker-syntax

Confirmat ca acel proiect foloseste acelasi id de limbaj `ftl` cu extensiile
`.ftl/.ftlh/.ftlx`.

---

## 2. Restrangerea la fisierele potrivite

> vreau sa rezolvi doar fisierele .ftl si .ftx

> ftx e tot ftl

Inlocuit filtrul pe limbaje (`html`, `xml`, ...) cu unul pe extensii de fisier,
`fileExtensions: ["ftl", "ftx"]`.

> cu html, nu e cu xml sau altceva

Clarificare: continutul fisierelor `.ftl` este HTML. Extensia ramane restransa la
`.ftl` si `.ftx`.

---

## 3. Prima problema: nu se declansa nimic

> nu se intampla nimic cand tastez `<#if user??>`

Bug real. Verificam pozitia cursorului in handlerul de `onDidChangeTextDocument`, dar
VS Code actualizeaza selectia **dupa** ce aplica editarea, deci verificarea pica mereu.
Rezolvat cu o amanare de 25 ms si verificarea versiunii documentului. Adaugat si
`freemarkerAutoClose.debug` plus comanda `FreeMarker: Show Auto-Close Log`.

> trebuie reinstalat?

> pune si `"freemarkerAutoClose.debug": true`

> da

Reparat `settings.json`, care avea backslash-uri neescapate in `java.project.outputPath`
si era JSON invalid.

---

## 4. A doua problema: mergea doar intr-un singur folder

> nu merge decat pe fisiere din acest director. pe altele din vs code nu merge

Cauza: Workspace Trust. Extensia nu declara ca functioneaza in workspace-uri fara
incredere, deci VS Code o dezactiva in Restricted Mode. Adaugat
`capabilities.untrustedWorkspaces` si `virtualWorkspaces`.

> merge. insa am alta extensie care pune automat >

Identificat vinovatul: `sj1cn.freemarker-plus` declara perechea `<` -> `>` in
`autoClosingPairs`.

---

## 5. Syntax highlighting

> adauga tu si freemarker syntax highlighting. te poti inspira din https://github.com/dcortes92/vs-freemarker sau poti pune tu toate instructiunile si tagurile.
> atentie - pe aceste fisiere ftl si ftx eu pot avea continut variat - freemarker, html si javascript.
> ar trebui toate sa fie highlighted

Gramatica TextMate peste `text.html.basic`, plus o gramatica de injectie care duce
FreeMarker inauntrul atributelor HTML si al JavaScript-ului din `<script>`. Configuratie
de limbaj proprie, fara perechea `<` -> `>`. Teste reale de tokenizare cu
`vscode-textmate`.

> poti sa te inspiri si din https://github.com/sj1-cn/freemarker-vscode
> imi place cum merge

De acolo a venit ideea sintaxei cu paranteze drepte, `[#if ...]`.

> ai implementat syntax highlighting? de ce nu se vede?
> ai implementat si syntax highlighting pentru combinat toate tagurile html comune si codul javascript din `<script>`

Era implementat si testat, dar nu era inca instalat.

> nu fololsesc sintaxa cu paranteze drepte, poti sa o scoti

Scoasa complet, si din gramatica si din logica de auto-close.

---

## 6. Scripturi si identitate

> cum fac update?

> fa-mi un install.bat care instaleaza extensia si un update.bat care o actualizeaza in vs code

> poti pune sa scrie jos FreeMarker - adiz?

Id de limbaj propriu, `freemarker-adiz`, afisat in bara de stare ca **FreeMarker - adiz**.
Serveste si ca diagnostic: se vede imediat daca fisierul a fost preluat de aceasta
extensie sau de alta care revendica tot `.ftl`.

---

## 7. Inchiderea tagurilor HTML

> fa-mi te rog sa se genereze tagul de inchidere si pentru toate tagurile html comune.. cand scriu `<div>` sa imi adauga `</div>`... etc

> de asemenea in javascript, deci in interiorul unui tag `<script>` cand scriu function nume(parametrii) si deschid acolada `{` sa imi pune imediat cea de inchidere `}`

Acoladele erau deja acoperite de configuratia de limbaj. Pentru taguri s-a adaugat
ramura HTML, cu elementele fara continut sarite si cu blocare inauntrul `<script>` si
`<style>`.

> da. dar inca nu merge pe html, cand deschid tagul script sa-l si inchida

> inca nu merge `<div>`

Ambele - versiunea nu era inca instalata.

---

## 8. Publicare

> fa-mi si un git_publish.bat care sa publice codul pe githubul meu https://github.com/adiz-ro

> cum instalez gh?

---

## 9. Documentatie

> fa-mi un prompt.md cu toate prompturile pe care ti le-am dat

> si un app.md care explica in mare ce face aplicatia
