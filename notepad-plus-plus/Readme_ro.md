# FreeMarker pentru Notepad++

*English version: [README.md](README.md).*

`freemarker.udl.xml` este un **User Defined Language** care aduce in Notepad++ aceleasi
reguli de sintaxa ca extensia de VS Code din acest repo: FreeMarker peste HTML, cu CSS
si JavaScript in acelasi fisier. Dupa instalare, `FreeMarker` apare in meniul
**Language**, iar fisierele `.ftl` si `.ftx` se coloreaza automat la deschidere.

Cerinte: Notepad++ 8.x (format UDL 2.1). Tema deschisa, fundal alb.

## Instalare

Varianta rapida, fara interfata:

1. Inchide Notepad++.
2. Copiaza `freemarker.udl.xml` in `%APPDATA%\Notepad++\userDefineLangs\`
   (in mod normal `C:\Users\<user>\AppData\Roaming\Notepad++\userDefineLangs\`).
3. Porneste Notepad++.

Poti face pasul 2 dintr-un terminal:

```bash
copy notepad-plus-plus\freemarker.udl.xml "%APPDATA%\Notepad++\userDefineLangs\"
```

Varianta prin interfata, daca preferi:

**Language** -> **User Defined Language** -> **Define your language...** -> **Import...**
-> alegi `freemarker.udl.xml` -> restart Notepad++.

Verificare: deschide `sample.ftl` din radacina proiectului. In bara de stare, jos, trebuie
sa scrie **FreeMarker**, tagurile HTML sunt albastre, atributele rosii, comentariul
`<#-- ... -->` verde, iar in marginea din stanga apar `+`/`-` pe `<#if>`, `<#list>` si
`<#macro>`.

Daca fisierul se deschide tot cu lexerul HTML, inseamna ca `ftl` si `ftx` sunt trecute la
extensiile utilizatorului pentru limbajul HTML (**Settings -> Preferences -> Language**,
lista din dreapta, campul de jos). Scoate-le de acolo si UDL-ul preia fisierele.

Dezinstalare: sterge fisierul din `userDefineLangs` si reporneste Notepad++.

## Ce coloreaza

Paleta este copiata din lexerul HTML al Notepad++ (`stylers.model.xml`, `LexerType
name="html"`), ca sa nu se vada diferenta cand treci de la **Language -> H -> HTML** la
**FreeMarker**. Si vocabularul vine din sursele Notepad++: `langs.model.xml`, `instre1`
pentru `html` (impartit in taguri si atribute), `javascript` si `css`.

| Element | Exemplu | Stil Notepad++ | Culoare |
| --- | --- | --- | --- |
| Taguri HTML | `div`, `/div`, `<`, `>`, `/` | TAG | albastru `0000FF` |
| Atribute HTML | `class`, `href`, `src`, `type` | ATTRIBUTE | rosu `FF0000` |
| Siruri, valori de atribut | `"text"` / `'text'` | DOUBLE / SINGLE STRING | mov `8000FF` |
| Numere | `42`, `3.14` | NUMBER | rosu `FF0000` |
| Text obisnuit | text intre taguri | DEFAULT | negru |
| JavaScript | `function`, `const`, `return` | JS KEYWORD | bleumarin `000080` |
| CSS | `@media`, `display`, `background-color` | CSS IDENTIFIER | `8080C0` |
| Directive FreeMarker | `#if`, `#assign`, `/#list` | USER TAGS1 | mov `6424DB`, bold italic |
| Apeluri de macro | `@ui.button`, `@card` | TAG UNKNOWN | verde `008040` |
| Built-in-uri | `?upper_case`, `?size` | - | `6424DB`, italic |
| Operatori-cuvant | `as`, `in`, `gt`, `and`, `not`, `true` | - | `000080`, bold |
| Interpolari | `${nume}`, `#{pret}` | - | `6424DB` pe crem `FEFDE0` |
| Comentarii | `<#-- ... -->` | COMMENT | verde `008000` |

Primele sapte randuri sunt exact stilurile lexerului HTML. Restul sunt lucruri pe care
lexerul HTML nu le cunoaste; culorile raman insa in paleta lui - `6424DB` este chiar
culoarea pe care o ai deja la `USER TAGS1`, unde ti-ai trecut directivele FreeMarker.

Directivele si interpolarile sunt colorate si **inauntrul** atributelor HTML, adica
`class="<#if activ>on</#if>"` si `href="${url}"` arata corect - echivalentul gramaticii
de injectie din extensia de VS Code.

`>`-ul din expresii nu strica nimic: `<#if (produse?size > 1)>` se coloreaza pana la
capat, pentru ca directivele sunt tokeni, nu delimitatori `<#` ... `>`.

### De ce sunt keyword-urile scrise `#if` si nu `<#if`

Lexerul UDL taie textul in tokeni la fiecare operator si la fiecare spatiu, apoi compara
**tokenul intreg** cu listele de cuvinte. Cum `<` si `>` sunt operatori, `<div class=...>`
se rupe in `<`, `div`, `class`, ... - deci un keyword scris `<div` nu se potriveste
niciodata, iar tagul ramane negru. De aceea:

- numele de taguri sunt cuvinte simple (`div`), plus forma de inchidere (`/div`);
- `<`, `>` si `/` sunt puse ele insele in lista de taguri, ca sa fie tot albastre;
- directivele sunt `#if`, `/#if` - nu `<#if`, `</#if>`;
- `/` a fost scos dintre operatori, altfel `/div` si `/#if` nu ar fi tokeni intregi.

Daca modifici listele prin interfata, tine minte regula asta - altfel intrarile noi nu vor
avea niciun efect.

## Folding

Se pliaza directivele-bloc din `src/freemarker.ts`: `#if`, `#list`, `#macro`, `#function`,
`#attempt`, `#compress`, `#escape`, `#noescape`, `#noparse`, `#switch`, `#outputformat`,
`#autoesc`, `#noautoesc`, `#transform`. `#else`, `#elseif`, `#recover`, `#case`,
`#default`, `#items`, `#sep` sunt marcaje intermediare, nu deschid un nivel nou.

`#assign` nu apare la folding: forma bloc `<#assign body>` si forma cu atribuire
`<#assign x = 1>` nu se pot distinge fara parser, iar includerea lor ar strica nivelurile.

**Tagurile HTML nu se pliaza.** Ar fi trebuit trecute tot ca simple cuvinte (`div`,
`/div`), iar atunci orice `div`, `table` sau `head` din text, dintr-un atribut sau dintr-un
nume de variabila deschidea o pliere fantoma si nivelurile o luau razna. Folding-ul
FreeMarker, care merge pe `#nume`, nu are problema asta.

## Inchiderea automata a tagurilor

Un UDL nu poate face asta singur (Notepad++ leaga functia nativa de inchidere de taguri
strict de lexerele lui native HTML/XML, nu si de UDL-uri - vezi punctul 6 din sectiunea
de limitari de mai jos). Solutia e `FreeMarkerAutoClose.py`, un script pentru plugin-ul
**PythonScript**, care porteaza 1:1 logica din
[`../src/freemarker.ts`](../src/freemarker.ts) (aceeasi extensie de VS Code din acest
repo) - aceleasi directive-bloc, aceleasi elemente HTML fara continut, aceeasi regula
`<#assign x>` (bloc) vs `<#assign x=1>` (de sine statatoare). Verificat cu aceleasi 83 de
cazuri din `test/freemarker.test.js`.

### Instalare

1. **Plugins -> Plugins Admin...**, bifeaza **PythonScript**, **Install**, lasa Notepad++
   sa restarteze cand cere.
2. **Plugins -> Python Script -> New Script...**, numeste-l `FreeMarkerAutoClose.py`.
   Lipeste continutul din [`FreeMarkerAutoClose.py`](FreeMarkerAutoClose.py) din acest
   folder si salveaza (`Ctrl+S`).

   Sau, fara interfata: copiaza fisierul direct in
   `%APPDATA%\Notepad++\plugins\Config\PythonScript\scripts\`.
3. **Plugins -> Python Script -> Configuration...**, selecteaza
   `FreeMarkerAutoClose.py` din lista, seteaza **Initialisation** pe **ATSTARTUP**,
   **OK**.
4. Restart Notepad++. Scriptul porneste automat de fiecare data de acum incolo.

Verificare: deschide `sample.ftl` si scrie `<#if x>` - ar trebui sa apara automat
`</#if>` cu cursorul intre taguri.

### Ce inchide

Aceleasi reguli ca in extensia de VS Code: directive-bloc (`#if`, `#list`, `#macro`,
`#function`, `#attempt`, `#compress`, `#escape`, `#noescape`, `#noparse`, `#switch`,
`#outputformat`, `#autoesc`, `#noautoesc`, `#transform`), apeluri de macro (`<@card>`,
`<@ui.button ...>`), taguri HTML in afara de elementele fara continut (`br`, `img`,
`input`, ...), si `<#assign` / `<#global` / `<#local` doar cand nu au atribuire. `>`-ul
din expresii (`<#if (a > b)>`, `<#if title == "a>b">`) nu inchide tagul prematur, iar in
`<script>`/`<style>` nu se inchid taguri HTML (directivele FreeMarker raman active).

### Limitari fata de extensia de VS Code

- Functioneaza doar in fisiere cu extensia `.ftl` / `.ftx` - modifica `FILE_EXTENSIONS`
  la inceputul scriptului daca ai nevoie de altele.
- Optiunile (`CLOSE_DIRECTIVES`, `CLOSE_USER_DIRECTIVES`, `CLOSE_HTML_TAGS`,
  `EXTRA_BLOCK_DIRECTIVES`, `IGNORED_DIRECTIVES`) se schimba direct in fisierul `.py`, nu
  dintr-un meniu de setari.
- Cauta inceputul tagului pe ultimele 8000 de caractere inaintea cursorului
  (`LOOKBACK` in script); un tag mai lung de atat, extrem de rar in practica, nu se
  inchide.
- Daca imparti fereastra Notepad++ in doua (split view), callback-ul PythonScript se
  leaga de editorul care era activ la incarcarea scriptului; in al doilea panou poate fi
  nevoie sa redeschizi fisierul o data dupa activarea scriptului.

## Limitari, ca sa stii dinainte

UDL este un lexer cu un singur nivel, nu un sistem de gramatici ca TextMate. De aici vin
diferentele fata de lexerul HTML nativ:

1. **Nu exista context.** Lexerul HTML stie daca un cuvant e in interiorul unui tag; UDL
   nu. Cum numele de taguri sunt cuvinte simple, un `div`, `p`, `table` sau `a` din text
   obisnuit, dintr-un comentariu sau dintr-un nume de variabila iese albastru. La fel,
   `class` sau `width` raman rosii oriunde apar, iar `display` albastru si in afara unui
   `<style>`. In practica se vede mai ales la variabilele FreeMarker scurte: un
   `<#list produse as p>` are `p`-ul albastru.
2. **Nu exista limbaje imbricate reale.** In `<script>` si `<style>` nu ruleaza lexerul de
   JavaScript sau de CSS; sunt doar listele de cuvinte-cheie din `langs.model.xml`. Lipsesc
   deci fundalul bleu al blocului de JavaScript, comentariile `//` si `/* */` din script si
   colorarea selectorilor CSS.
3. **Cuvintele care sunt si tag, si atribut** merg intr-o singura lista. `style`, `title`,
   `data`, `dir`, `list`, `cite` si `summary` sunt tratate ca atribute (rosii), pentru ca
   asa apar cel mai des; asta inseamna ca `<style>` si `<title>` sunt rosii, nu albastre.
   Se muta usor dintr-o lista in alta, din `Keywords Lists`.
4. **Valorile neghilimelate si entitatile** (`&nbsp;`) raman text obisnuit. In lexerul HTML
   sunt portocaliu pe crem, respectiv negru pe crem.
5. **Built-in-urile merg pe prefix `?`**, deci orice `?nume` se coloreaza - inclusiv unele
   inventate. Efect secundar: si operatorul `??` primeste culoarea de built-in. La fel,
   macro-urile merg pe prefix `@`, deci si `@media` din CSS iese verde.
6. **Comentariile sunt definite ca delimitator, nu ca "Comment"**, adica `Ctrl+Q` (Edit ->
   Comment/Uncomment) nu comenteaza cu `<#-- -->` si comentariile nu se pliaza. Motivul e
   un defect al lexerului: cu comentariul pus in slotul de comentarii, fiecare comentariu
   din fisier impinge marcajele de folding cu inca un rand mai jos. Culoarea verde ramane
   identica, doar mecanismul din spate difera.
7. **Ghilimelele simple sunt globale.** Un apostrof intr-un text obisnuit porneste un sir
   pana la urmatorul apostrof. Daca te deranjeaza, sterge `09' 10\ 11'` din linia
   `<Keywords name="Delimiters">` si salveaza fisierul.

In schimb, fata de lexerul HTML castigi exact lucrurile pentru care exista fisierul:
comentariile `<#-- -->` sunt verzi cap-coada, interpolarile `${...}` se vad, macro-urile
`<@...>` nu mai sunt "tag necunoscut", iar folding-ul functioneaza pe directivele
FreeMarker.

**Inchiderea automata de taguri nu functioneaza cu UDL.** `Settings -> Preferences ->
Auto-Completion -> Auto-Insert -> Close Tags` este functia nativa care face asta, dar
Notepad++ o leaga strict de lexerele lui native HTML si XML - nu si de UDL-uri, indiferent
cum sunt definite. E motivul pentru care, inainte sa existe acest UDL, cand `.ftl`/`.ftx`
erau mapate la lexerul HTML nativ, inchiderea automata mergea; dupa ce extensiile trec la
UDL-ul `FreeMarker`, native nu mai merge. Plugin-uri ca **HTML Tag** nu ajuta - fac
jumping/selectie/renaming de taguri, nu inchidere la tastare, si depind tot de aceeasi
functie nativa. Solutia care chiar functioneaza e scriptul `FreeMarkerAutoClose.py`,
descris mai sus in sectiunea "Inchiderea automata a tagurilor".

## Personalizare

Culorile se schimba cel mai comod din **Language** -> **User Defined Language** ->
**Define your language...**, tab-urile `Folder & Default`, `Keywords Lists`, `Comment &
Number`, `Operators & Delimiters`. Notepad++ salveaza singur inapoi in
`userDefineLangs\freemarker.udl.xml`.

Ca sa adaugi alte extensii de fisier, modifica atributul `ext` din a doua linie utila a
fisierului:

```xml
<UserLang name="FreeMarker" ext="ftl ftx ftlh ftlx" udlVersion="2.1">
```
