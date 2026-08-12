# Provocari la integrarea FreeMarker cu Notepad++ (UDL)

Note de proiect despre ce a fost greu la portarea gramaticii FreeMarker (gandita initial
pentru extensia VS Code) intr-un **User Defined Language** pentru Notepad++, plus ce am
facut de fapt in fiecare iteratie si de ce am renuntat la ideea initiala. Nu acopera
partea de VS Code, doar UDL-ul.

## 1. Ideea de start, abandonata: delimitatori `<# ... >`

**Ce credeam initial.** Ca gramatica TextMate a extensiei VS Code (in
`syntaxes/freemarker.tmLanguage.json`) foloseste `begin`/`end` pentru taguri
(`<#directiva` ... pana la `>`), am plecat de la ideea ca acelasi model se traduce direct
in UDL: definesc `<#` ca inceput de delimitator si `>` ca sfarsit.

**De ce nu a mers.** UDL nu stie sa sara peste parantezele din interior, asa cum face
gramatica TextMate prin regula `group` din `freemarker.tmLanguage.json` (care exista
tocmai pentru cazul `<#if (a > b)>`). Un delimitator UDL `<#` ... `>` s-ar fi inchis la
primul `>` intalnit, adica exact la cel din interiorul parantezei - taind restul
directivei ca text necolorat.

**Ce am facut pana la urma.** Am renuntat total la delimitatori pentru taguri si le-am
tratat ca **cuvinte-cheie** (`Keywords1`/`Folders`), cu `<` si `>` colorate separat ca
operatori obisnuiti. Fara delimitator de inchis, `>`-ul din paranteze nu mai "inchide"
nimic - problema dispare de la sine, fara sa fie nevoie de vreo regula speciala pentru
paranteze, asa cum are VS Code.

## 2. Tot textul a iesit negru si ingrosat

**Ce credeam initial.** Ca portarea e directa: iau numele tagurilor asa cum apar in text
- `<div`, `<a`, `<#if`, `</table` - le pun in listele de cuvinte-cheie si Notepad++ le
recunoaste, la fel cum le recunoaste gramatica TextMate prin regexuri de tipul
`(<)(#)([a-zA-Z_]...)`.

**Ce a iesit.** Dupa prima instalare, tot fisierul aparea negru si bold - inclusiv
`<div>`, `<a>`, `<table>`, care ar fi trebuit sa fie albastre ca in lexerul HTML nativ.
Nu exista nicio eroare sau avertisment la incarcare, doar rezultatul vizual gresit.

**De ce se intampla.** Lexerul UDL taie textul in tokeni la fiecare operator si la
fiecare spatiu, apoi compara **tokenul intreg** cu listele de cuvinte-cheie. Cum `<` era
definit ca operator, `<div class="x">` se rupea in tokenii `<`, `div`, `class`, `"x"`,
`>` - iar un keyword scris `<div` nu se potrivea niciodata cu tokenul `div` singur. Tot ce
nu se potrivea cadea pe stilul DEFAULT, pe care il copiasem bold din lexerul HTML nativ
(unde bold-ul e corect, pentru ca acolo se aplica doar textului dintre taguri, nu la tot
fisierul).

Am confirmat asta abia dupa ce am pornit o instanta Notepad++ izolata si am testat
fisiere `.ftl` minimale, cu taguri si cuvinte simple alaturate, ca sa vad exact ce anume
se coloreaza si ce nu.

**Ce am facut pana la urma.** Am rescris toate listele de cuvinte-cheie ca **tokeni
intregi, fara `<`**: numele de taguri au devenit cuvinte simple (`div` in loc de `<div`),
plus forma de inchidere separata (`/div`), iar `<`, `>` si `/` au fost puse ele insele ca
intrari in lista de taguri, ca sa iasa si ele albastre. La fel pentru directive: `#if`
in loc de `<#if`, `/#if` in loc de `</#if`. Am facut acelasi lucru si pe DEFAULT -
scos bold-ul, ramas doar text normal negru.

## 3. `/` ca operator bloca formele de inchidere

**Ce credeam.** Ca odata rezolvat pasul 2 (cuvinte simple + `<`/`>` separate), totul avea
sa functioneze, inclusiv `</div>` si formele de inchidere `/#if` pentru folding.

**Ce a iesit.** `</div>` tot nu se colora corect, iar folding-ul pe `/#if` nu functiona
deloc - marcajele de `+`/`-` din stanga lipseau la `</#if>`.

**De ce.** `/` ramasese in lista de operatori (mostenit din regula "operatori" a
gramaticii TextMate, care include `/` ca operator de impartire). Cu `/` operator,
`</div>` se rupea in patru tokeni separati - `<`, `/`, `div`, `>` - nu in tokenul unic
`/div` pe care il pusesem in lista de taguri.

**Ce am facut pana la urma.** Am scos `/` din lista de operatori si l-am lasat sa existe
doar ca intrare separata in lista de taguri (pentru cazul `/>`, autoinchidere). Formele
de inchidere (`/div`, `/#if`, `/#list` etc.) au devenit tokeni intregi valizi, atat
pentru colorare cat si pentru folding.

## 4. Folding-ul HTML producea plieri fantoma

**Ce credeam initial.** Ca, la fel ca in `language-configuration.json` din extensia VS
Code (care are un `folding.markers` pe baza de regex pentru `<#if|list|...>` si nu
foldeaza HTML-ul explicit, dar am vrut sa adaug totusi un echivalent pentru
taguri container HTML: `div`, `table`, `script`, `html`, `head`, `body` etc., ca
utilizatorul sa poata plia si sectiuni HTML mari, nu doar blocuri FreeMarker.

**Ce a iesit.** Cu numele de taguri devenite cuvinte simple (necesar dupa pasul 2), orice
aparitie a cuvantului `title`, `td`, `div` sau `table` - inclusiv in text obisnuit,
intr-un atribut, sau in interiorul unui `${...}` - deschidea un marcaj de folding fals.
Fara context (UDL nu stie daca esti "in interiorul unui tag" sau nu), nivelurile de
plisare deveneau incoerente pe fisiere reale ca `sample.ftl`.

**Ce am facut pana la urma.** Am renuntat complet la folding-ul pe taguri HTML. Am
pastrat doar folding-ul pe directivele FreeMarker (`#if`, `#list`, `#macro`,
`#function` etc., preluate exact din `BLOCK_DIRECTIVES` din `src/freemarker.ts`), pentru
ca acelea sunt cuvinte mult mai rare si mult mai putin probabil sa apara accidental in
text sau in nume de variabile.

## 5. Cel mai greu de gasit: comentariul bloc decala folding-ul cu un rand

**Ce credeam initial.** Ca portarea comentariului `<#-- ... -->` e trivial: exista un
slot dedicat "Comments" in formatul UDL, exact pentru asta, cu sintaxa
`03<#-- 04-->` (cifrele `03`/`04` marcheaza inceput/sfarsit conform formatului UDL). L-am
pus acolo direct.

**Ce a iesit.** Pe fisiere de test minimale (fara comentarii), folding-ul FreeMarker parea
sa functioneze perfect. Abia pe `sample.ftl` (care are un `<#-- Fisier de proba... -->` la
inceput), marcajele de `+`/`-` din stanga erau sistematic decalate cu un rand fata de
directiva reala careia ii apartineau - `<#if>` avea marcajul de folding pe linia de
dedesubt, `<#macro>` la fel.

**Cum am gasit cauza.** Nu se vedea din prima, pentru ca fisierele scurte de test nu
aveau niciun comentariu inaintea blocurilor testate. Am izolat problema prin cautare
binara - am taiat `sample.ftl` in bucati (jumatate din fisier, apoi un sfert etc.) pana
am localizat exact ce linie strica alinierea - si am confirmat cu un fisier minimal de
2 linii: un singur `<#-- comentariu -->` pus inaintea unui `<#if>` este suficient sa
decaleze permanent toate marcajele de folding de dupa el cu un rand.

**Ce am facut pana la urma.** Am mutat comentariul din slotul dedicat "Comments" intr-un
slot de **delimitator** (`Delimiters`, cu perechea `<#-- ... -->` si culoarea setata la
verde, aceeasi ca inainte). Vizual e identic cu ce ar fi fost prin slotul "Comments", dar
mecanismul intern e altul, iar folding-ul ramane aliniat corect indiferent de cate
comentarii contine fisierul. Cost secundar acceptat: `Ctrl+Q`
(Edit -> Comment/Uncomment) nu mai stie sa comenteze automat cu `<#-- -->`, pentru ca
acea comanda din Notepad++ e legata specific de slotul "Comments", nu de delimitatori.

## 6. Cuvinte care sunt si tag HTML, si atribut

**Ce credeam.** Ca pot imparti curat vocabularul HTML luat din `langs.model.xml`
(lista `instre1` a lexerului `html` din Notepad++) in doua liste separate - taguri si
atribute - fara suprapuneri.

**Ce a iesit.** FreeMarker/HTML au cuvinte ambigue: `style`, `title`, `data`, `dir`,
`list`, `cite`, `summary`, `span`, `code`, `form`, `label`, `map`, `menu`, `object`,
`param`, `time`, `var`, `command` sunt si nume de tag, si nume de atribut. UDL nu poate
pune acelasi cuvant in doua liste cu stiluri diferite si sa aleaga corect dupa context -
cuvantul primeste intotdeauna stilul primei liste in care e gasit (comportament dependent
de ordinea interna de evaluare, nu documentat explicit).

**Ce am facut pana la urma.** Am ales manual, per cuvant, in ce lista intra, dupa cum
apare mai des in practica: `style`/`title`/`data`/`dir`/`list`/`cite`/`summary` merg ca
**atribute** (rosii), deci `<style>` si `<title>` ies rosii, nu albastre - o compensare
constienta, documentata explicit in `README.md`/`Readme_ro.md`, nu o eroare ramasa
nerezolvata.

## 7. Fara mediu de testare vizual automat

**Ce credeam initial.** Ca pot valida fisierul UDL doar citind XML-ul si verificand ca e
bine format, sau cel mult cerand utilizatorului o captura de ecran dupa fiecare
modificare.

**De ce nu a fost suficient.** XML valid nu inseamna deloc ca lexerul se comporta cum
astept - toate cele 6 probleme de mai sus au XML perfect valid si totusi randare gresita.
Iar utilizatorul avea deja Notepad++ deschis cu fisiere de lucru (`upload.ftl` si altele,
vazute intr-o captura trimisa de el) - nu puteam cere restart repetat pe sesiunea lui
pentru fiecare din cele ~10 iteratii de testare.

**Ce am facut pana la urma.** Am pornit instante Notepad++ **complet izolate**, cu
`-multiInst -nosession -noPlugin -settingsDir=<folder separat din scratchpad>`, fiecare cu
propriul `userDefineLangs` continand doar UDL-ul de testat. Prima incercare de captura
(metoda standard, ecran peste fereastra adusa in prim-plan) prindea uneori alta fereastra
aflata deasupra (ex. Gmail dintr-un alt tab) - a trebuit trecut pe **`PrintWindow`**
(apel Win32 direct, cu flag-ul `PW_RENDERFULLCONTENT`), care randeaza fereastra Notepad++
in memorie indiferent daca era acoperita sau in fundal, fara sa fure focus-ul de la
utilizator si fara sa depinda de ce se afla deasupra pe ecran.

Fiecare ipoteza (ce se coloreaza, ce se pliaza, cum se tokenizeaza) a fost verificata
empiric prin fisiere `.ftl` minimale de proba, capturi marite (zoom pe regiunea de
interes) si comparatie pixel-cu-pixel a culorilor rezultate - nu dedusa doar din
documentatia formatului UDL, care nu explica tokenizarea sau bug-ul de folding de la
comentarii.

## Cronologia iteratiilor pe fisierul UDL

1. **v1** - taguri ca delimitatori `<# ... >` (abandonat inainte de a fi testat, din
   cauza problemei cu `>` din paranteze, vezi punctul 1).
2. **v2** - taguri si directive ca keyword-uri scrise cu `<` (`<div`, `<#if`). Rezultat:
   tot fisierul negru si bold (punctul 2).
3. **v3** - taguri redenumite ca simple cuvinte (`div`, `#if`) + `<`/`>` in lista de
   taguri + `<` si `>` scoase din operatorii care s-ar fi suprapus. Rezultat: colorarea
   e corecta, dar `</div>` si folding-ul pe `/#if` tot nu functionau (punctul 3).
4. **v4** - scos `/` din lista de operatori. Rezultat: colorare si folding FreeMarker
   corecte pe fisiere de test minimale; adaugat si folding pentru taguri HTML container.
   Pe `sample.ftl` insa, folding-ul HTML producea plieri fantoma (punctul 4).
5. **v5** - eliminat complet folding-ul pe taguri HTML, pastrat doar cel pe directivele
   FreeMarker. Rezultat: aproape corect, dar marcajele de folding FreeMarker erau
   decalate cu un rand pe `sample.ftl` din cauza comentariului bloc (punctul 5).
6. **v6 (final)** - comentariul mutat din slotul "Comments" in slotul de delimitator,
   cu aceeasi culoare verde. Verificat din nou pe `sample.ftl` intr-o instanta izolata:
   colorare corecta, folding aliniat pe randul corect, fara efecte secundare vizibile in
   afara de `Ctrl+Q` care nu mai insereaza automat `<#-- -->`.

Versiunea instalata efectiv in `%APPDATA%\Notepad++\userDefineLangs\freemarker.udl.xml`
si publicata in repo la `notepadpp/freemarker.udl.xml` este v6.

## Rezumat: reguli descoperite despre UDL, nu documentate explicit in interfata

- Un keyword UDL trebuie sa fie **exact un token dupa tokenizare** (text taiat la
  operatori si spatii); un keyword care incepe cu un caracter definit ca operator nu se
  potriveste niciodata, indiferent cat de "corect" arata in XML.
- `Prefix` (ex. `?` pentru built-in-uri, `@` pentru macro-uri) functioneaza pe token
  intreg care *incepe* cu prefixul, deci coloreaza si combinatii neintentionate (`??`,
  `@media` din CSS).
- Comentariul definit in slotul dedicat "Comments" are un defect de aliniere a foldarii
  cand apar mai multe comentarii intr-un fisier; folosirea lui ca delimitator e un
  workaround functional, nu solutia "canonica" din documentatia formatului.
- Folding-ul pe cuvinte foarte comune (nume de taguri HTML) nu e sigur fara context -
  orice cuvant care poate aparea si in afara unui tag va produce plieri fantoma.
- UDL nu are context lexical - orice ambiguitate (cuvant care e si tag si atribut, sau
  care apare si in text normal) trebuie rezolvata manual, alegand un singur castigator,
  nu deductibila automat din pozitia in linie.
