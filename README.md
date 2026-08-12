# FreeMarker Tag Auto-Close & Syntax

Doua lucruri pentru fisierele `.ftl` si `.ftx`:

1. **Syntax highlighting** pentru FreeMarker peste HTML, cu JavaScript in `<script>` si
   CSS in `<style>`.
2. **Inchiderea automata a tagurilor** in momentul in care tastezi `>`.

## Syntax highlighting

Gramatica porneste de la HTML-ul nativ din VS Code (`text.html.basic`), deci primesti
gratuit tot ce stie VS Code despre HTML, plus JavaScript in `<script>` si CSS in
`<style>`. Peste el se suprapun regulile FreeMarker: directive, apeluri de macro,
comentarii `<#-- -->`, interpolari `${...}` si `#{...}`, siruri, numere, built-in-uri
(`?upper_case`, `?size`), operatori.

O gramatica de injectie duce FreeMarker si **inauntrul** celorlalte limbaje, ceea ce
conteaza in practica:

```ftl
<a href="${url}" class="<#if activ>on</#if>">x</a>
<script>
  var n = ${count};
  <#if debug>console.log(n);</#if>
</script>
```

Aici `${url}`, `<#if activ>`, `${count}` si `<#if debug>` sunt colorate ca FreeMarker,
nu ca text dintr-un sir JavaScript sau dintr-un atribut HTML.

Deschide `sample.ftl` din proiect ca sa vezi toate cazurile intr-un singur fisier.

## Inchiderea automata a tagurilor

Inchide automat tagurile FreeMarker in momentul in care tastezi `>`.

```
scrii:   <#if user??>
obtii:   <#if user??>|</#if>          (cursorul ramane la |)

scrii:   <@ui.button label="ok">
obtii:   <@ui.button label="ok">|</@ui.button>
```

## Ce inchide

| Categorie | Exemple |
| --- | --- |
| Directive bloc | `#if`, `#list`, `#items`, `#sep`, `#macro`, `#function`, `#attempt`, `#compress`, `#escape`, `#noescape`, `#noparse`, `#switch`, `#outputformat`, `#autoesc`, `#noautoesc`, `#transform` |
| Apeluri de macro | `<@card>`, `<@ui.button ...>`, `<@(expresie)>` |
| Bloc doar fara atribuire | `<#assign body>` da, `<#assign x = 1>` nu |
| Taguri HTML | `<div>`, `<span>`, `<table>`, `<my-widget>`, `<svg:rect>` |

Pentru HTML se sar elementele fara continut - `br`, `hr`, `img`, `input`, `meta`,
`link`, `source`, `track`, `col`, `embed`, `area`, `base`, `param`, `wbr`.

Inauntrul unui `<script>` sau `<style>` nu se inchid taguri HTML, pentru ca acolo un
`<` este aproape mereu o comparatie sau un generic (`a < b`, `Array<string>`), nu un
element. Directivele FreeMarker raman insa active si acolo, deci `<#if debug>` din
mijlocul unui script se inchide normal.

Acoladele, parantezele si ghilimelele se inchid singure prin configuratia de limbaj -
inclusiv in JavaScript-ul din `<script>`, unde `function f(x) {` primeste `}`.

Nu se atinge de directivele care nu au tag de inchidere (`#else`, `#elseif`, `#break`,
`#return`, `#include`, `#import`, `#nested`, `#case`, `#default`, `#recover`, `#ftl`,
`#setting` etc.), de comentarii `<#-- ... -->`, de tagurile HTML obisnuite si nici de
tagurile inchise explicit (`<@card />`).

Detaliile pe care le trateaza corect:

- `>` din expresii nu inchide tagul prematur: `<#if (a > b)>` produce `</#if>`, iar
  `<#if title == "a>b">` la fel.
- taguri scrise pe mai multe linii.
- nu insereaza nimic daca acelasi tag de inchidere se afla deja imediat dupa cursor.
- o singura apasare de Undo (`Ctrl+Z`) sterge tagul inserat automat.

## Unde se activeaza

Doar in fisiere `.ftl` si `.ftx`. In `.html`, `.xml` sau orice altceva nu se intampla
nimic, chiar daca fisierul contine taguri FreeMarker.

## Si pentru Notepad++

Aceleasi reguli de sintaxa, portate ca **User Defined Language**, sunt in
`notepadpp/freemarker.udl.xml`. Copiezi fisierul in
`%APPDATA%\Notepad++\userDefineLangs\`, repornesti Notepad++ si `.ftl` / `.ftx` se
coloreaza ca **FreeMarker**, cu folding pe directive si pe tagurile HTML.

Instructiuni complete, ce acopera si ce nu poate face un UDL: `notepadpp/Readme_ro.md`
(sau `notepadpp/README.md`, aceleasi lucruri in engleza).

## Setari

| Setare | Implicit | Descriere |
| --- | --- | --- |
| `freemarkerAutoClose.enabled` | `true` | Porneste / opreste extensia |
| `freemarkerAutoClose.fileExtensions` | `["ftl", "ftx"]` | Extensiile de fisier vizate |
| `freemarkerAutoClose.languages` | `[]` | Limbaje suplimentare, daca vrei sa extinzi |
| `freemarkerAutoClose.closeDirectives` | `true` | Inchide `<#...>` |
| `freemarkerAutoClose.closeUserDirectives` | `true` | Inchide `<@...>` |
| `freemarkerAutoClose.closeHtmlTags` | `true` | Inchide `<div>` si celelalte taguri HTML |
| `freemarkerAutoClose.extraBlockDirectives` | `[]` | Directive proprii de inchis |
| `freemarkerAutoClose.ignoredDirectives` | `[]` | Directive de ignorat, ex. `["sep"]` |
| `freemarkerAutoClose.debug` | `false` | Scrie in log motivul pentru care un tag nu a fost inchis |

Comenzi in paleta (`Ctrl+Shift+P`):

- `FreeMarker: Toggle Tag Auto-Close` - porneste / opreste rapid extensia.
- `FreeMarker: Show Auto-Close Log` - deschide panoul de output cu diagnosticul.

## Daca nu se intampla nimic

1. `Ctrl+Shift+P` -> **Developer: Reload Window** dupa instalare.
2. Verifica in bara de jos ca fisierul este `.ftl` sau `.ftx`.
3. Pune `"freemarkerAutoClose.debug": true` in setari, ruleaza
   `FreeMarker: Show Auto-Close Log` si tasteaza din nou tagul. Logul spune exact de ce
   a fost ignorat.

## Instalare

Dublu-click pe **`install.bat`**. Verifica Node.js si comanda `code`, instaleaza
dependintele, ruleaza testele, construieste `.vsix`-ul si il instaleaza in VS Code.
La final apasa `Ctrl+Shift+P` -> **Developer: Reload Window**.

## Actualizare

Dupa orice modificare in cod, dublu-click pe **`update.bat`**. Recompileaza, ruleaza
testele, reimpacheteaza, scoate versiunea veche si o instaleaza pe cea noua.

Reload-ul este obligatoriu - VS Code nu incarca extensia noua fara el.

Daca preferi comenzile manuale:

```bash
npm test && npx @vscode/vsce package --allow-missing-repository && code --install-extension freemarker-tag-autoclose-0.2.0.vsix --force
```

Dezinstalare:

```bash
code --uninstall-extension adiz.freemarker-tag-autoclose
```

### Conflicte cu alte extensii FreeMarker

O singura extensie poate detine limbajul unui fisier `.ftl`. Daca ai instalate si
`dcortes92.freemarker`, `sj1cn.freemarker-plus` sau altele care revendica `.ftl`,
rezultatul e imprevizibil: se poate incarca gramatica lor in locul acesteia.

Verifici usor: deschide un `.ftl` si uita-te in bara de stare, jos-dreapta. Daca scrie
**FreeMarker - adiz**, extensia asta a castigat fisierul. Orice altceva inseamna ca
alta extensie l-a preluat, si atunci nici highlighting-ul, nici configuratia de limbaj
de aici nu se aplica.

Poti forta manual: click pe numele limbajului din bara de stare -> alege
**FreeMarker - adiz**. Ca sa fie permanent pentru toate fisierele `.ftl`, adauga in
`settings.json`:

```json
"files.associations": {
  "*.ftl": "freemarker-adiz",
  "*.ftx": "freemarker-adiz"
}
```

`sj1cn.freemarker-plus` in special declara perechea `<` -> `>` in `autoClosingPairs`,
adica iti pune `>` automat cand tastezi `<` - ceea ce intra direct in conflict cu
inchiderea de taguri de aici.

Daca vrei ca extensia asta sa functioneze complet, dezactiveaza-le pe celelalte din
panoul **Extensions**.

### Rulare in mod dezvoltare

Deschide folderul in VS Code si apasa `F5`. Se deschide o fereastra
**Extension Development Host** cu extensia incarcata. Util cand vrei sa modifici ceva.

## Lansarea unei versiuni noi

**`build.bat`** face tot lantul dintr-o singura comanda: teste, incrementarea versiunii
din `package.json`, `.vsix`, instalare in VS Code, commit, push si tag git.

```bash
build.bat patch "Adaug inchiderea tagurilor HTML"
```

| Comanda | Efect |
| --- | --- |
| `build.bat` | patch, mesaj implicit `Release v0.3.1` |
| `build.bat patch "mesaj"` | `0.3.0` -> `0.3.1` |
| `build.bat minor "mesaj"` | `0.3.0` -> `0.4.0` |
| `build.bat major "mesaj"` | `0.3.0` -> `1.0.0` |
| `build.bat "mesaj"` | patch, cu mesajul dat |

Testele ruleaza **inainte** de incrementare, deci daca pica, versiunea ramane neatinsa
si nu se publica nimic. Daca build-ul reuseste dar push-ul esueaza, versiunea noua e
deja instalata local si poti relua doar publicarea cu `git_publish.bat`.

Fiecare lansare primeste si un tag git, `v0.3.1`, impins pe GitHub.

Foloseste `update.bat` cand vrei doar sa reconstruiesti si sa reinstalezi local, fara
sa schimbi versiunea si fara sa publici.

## Publicare pe GitHub, separat

Dublu-click pe **`git_publish.bat`**. Ruleaza testele, initializeaza repo-ul daca e
nevoie, comite si trimite pe `github.com/adiz-ro/freemarker-tag-autoclose`.

Vizibilitatea implicita este **private**. Daca vrei repo public, schimba in script
linia `set "VISIBILITY=private"`.

Repo-ul trebuie sa existe pe GitHub inainte, creat gol - fara README, fara `.gitignore`
si fara licenta. Daca ai instalat utilitarul `gh`, scriptul il creeaza singur.

Ghidul complet - pregatire, instalare `gh`, trecerea din privat in public si ce faci
cand push-ul esueaza - este in `how_to_github.md`.

Poti da si un mesaj de commit:

```bash
git_publish.bat "Adaug inchiderea tagurilor HTML"
```

## Dezvoltare

```bash
npm run watch   # recompilare la salvare
npm test        # teste pentru logica de detectie si pentru gramatica
```

Logica pura sta in `src/freemarker.ts` si este acoperita de teste;
`src/extension.ts` contine doar integrarea cu VS Code.
