# Cum functioneaza extensia

Explicatie de ansamblu: ce face, din ce e facuta si de ce e facuta asa.
Pentru instalare si setari, vezi `README.md`.

## Ce face

O extensie de VS Code pentru sabloane FreeMarker (`.ftl`, `.ftx`), cu doua functii
care nu depind una de alta:

1. **Syntax highlighting** pentru trei limbaje amestecate in acelasi fisier: FreeMarker,
   HTML si JavaScript / CSS.
2. **Inchiderea automata a tagurilor** cand tastezi `>`: directive FreeMarker, apeluri
   de macro si taguri HTML.

Un sablon FreeMarker tipic arata asa - trei limbaje intr-un singur fisier, imbricate
unul in altul:

```ftl
<#list produse as p>
  <a href="${p.url}" class="<#if p.nou>nou</#if>">${p.nume}</a>
</#list>

<script>
  var total = ${produse?size};
  <#if debug>console.log(total);</#if>
</script>
```

## Cele doua jumatati

### 1. Highlighting - declarativ

Nu ruleaza cod. Sunt doar fisiere de configurare pe care le citeste VS Code.

| Fisier | Rol |
| --- | --- |
| `syntaxes/freemarker.tmLanguage.json` | Gramatica principala |
| `syntaxes/freemarker.injection.json` | Gramatica de injectie |
| `language-configuration.json` | Comentarii, paranteze, folding, auto-inchidere |

Ideea centrala a gramaticii principale sunt cele doua randuri de la inceput:

```json
"patterns": [
  { "include": "#freemarker" },
  { "include": "text.html.basic" }
]
```

FreeMarker se incearca primul, apoi se cade pe gramatica HTML nativa a VS Code. De
acolo vin gratuit toate tagurile HTML, JavaScript-ul din `<script>` si CSS-ul din
`<style>` - nu le reimplementez, le mostenesc.

Problema care ramane: asta acopera doar FreeMarker aflat la nivelul de sus. Un
`${url}` dintr-un atribut HTML sau un `<#if>` din mijlocul unui script ar fi ramas
colorate ca text obisnuit. De asta exista **gramatica de injectie**: cu selectorul
`L:text.html.freemarker` se aplica peste tot in fisier, inclusiv inauntrul limbajelor
incorporate, si reutilizeaza aceleasi reguli prin `text.html.freemarker#freemarker`.
Un singur set de reguli, doua locuri unde se aplica.

Un detaliu care merita mentionat: regula `group` din gramatica, care consuma perechile
de paranteze. Fara ea, `<#if (a > b)>` s-ar termina la primul `>`, iar restul expresiei
ar deveni text HTML.

### 2. Auto-close - cod

| Fisier | Rol |
| --- | --- |
| `src/freemarker.ts` | Logica de decizie, fara nicio dependenta de VS Code |
| `src/extension.ts` | Integrarea cu editorul |

Separarea nu e cosmetica: `freemarker.ts` este o functie pura,
`computeClosingTag(textInaintedeCursor) -> string | null`, deci poate fi testata cu
`node --test`, fara sa pornesti VS Code. Acolo sta toata partea grea.

**Cum decide.** Primeste textul de dinaintea cursorului, care se termina cu `>`-ul
tocmai tastat, si:

1. Gaseste ultimul `<` inainte de el.
2. Verifica, printr-un scanner care sare peste stringuri si peste paranteze, ca `>`-ul
   tastat chiar inchide acel tag. Asta face ca `<#if (a > b)>` si `<#if t == "a>b">`
   sa functioneze corect.
3. Dupa caracterul de dupa `<` alege ramura: `#` directiva, `@` macro, litera tag HTML,
   orice altceva (`/`, `!`, `?`) inseamna ca nu e nimic de inchis.

**Ce nu inchide, si de ce.** Aici sta jumatate din valoarea extensiei:

- Directive care nu au tag de inchidere: `<#else>`, `<#include>`, `<#case>`, `<#ftl>`.
- `<#assign x = 1>` este de sine statatoare, dar `<#assign body>` deschide un bloc -
  diferenta o face prezenta unui `=` de nivel superior, nu unul din `==` sau dintr-un
  string.
- Elemente HTML fara continut: `<br>`, `<img>`, `<input>`, `<meta>`.
- Taguri deja inchise explicit: `<@card />`.
- Comentarii `<#-- -->`, `<!DOCTYPE>`, `<?xml ?>`.
- **Taguri HTML din interiorul unui `<script>` sau `<style>`.** Acolo un `<` e aproape
  mereu o comparatie sau un generic - `if (a < b)`, `Array<string>` - si fara aceasta
  regula ai primi `</string>` in mijlocul codului. Directivele FreeMarker raman insa
  active si acolo.

**Integrarea cu editorul** are o singura subtilitate, dar una care a costat o versiune
intreaga: VS Code trimite evenimentul de modificare a documentului **inainte** sa
actualizeze selectia editorului. Verificarea pozitiei cursorului direct in handler pica
mereu si nu se insera niciodata nimic. De aceea `extension.ts` amana verificarea cu
25 ms si confirma intre timp ca versiunea documentului nu s-a schimbat.

Inserarea se face cu `insertSnippet` si un `$0`, ca sa ramana cursorul intre taguri, si
cu `undoStopBefore: false`, ca un singur `Ctrl+Z` sa stearga tagul adaugat automat.

## Testele

`npm test` ruleaza doua fisiere:

- `test/freemarker.test.js` - logica de decizie, ca functie pura.
- `test/grammar.test.js` - tokenizeaza mostre de cod cu `vscode-textmate` si oniguruma,
  incarcand gramaticile HTML, JavaScript si CSS **din instalarea ta locala de VS Code**,
  si verifica scope-urile rezultate.

Al doilea e cel care conteaza: fara el, "highlighting-ul merge" ar fi o presupunere.
Asa se verifica efectiv ca `${url}` dintr-un atribut e colorat ca FreeMarker si ca
JavaScript-ul din `<script>` primeste scope-uri `source.js`.

## De ce un id de limbaj propriu

Limbajul se numeste `freemarker-adiz`, nu `ftl`. Motivul e practic: si alte extensii
FreeMarker revendica `.ftl`, iar un singur limbaj poate castiga un fisier. Cu un id
distinct, bara de stare devine diagnostic - daca scrie **FreeMarker - adiz**, extensia
asta a preluat fisierul; orice altceva inseamna ca a castigat alta, si atunci nici
gramatica, nici configuratia de limbaj de aici nu se aplica.

Asocierea se forteaza din `settings.json`:

```json
"files.associations": {
  "*.ftl": "freemarker-adiz",
  "*.ftx": "freemarker-adiz"
}
```

## Structura fisierelor

```
src/freemarker.ts              logica pura de decizie
src/extension.ts               integrarea cu VS Code
syntaxes/*.json                gramaticile TextMate
language-configuration.json    comentarii, paranteze, auto-inchidere
test/freemarker.test.js        teste pentru logica
test/grammar.test.js           teste de tokenizare
package.json                   contributiile catre VS Code si setarile
sample.ftl                     fisier de proba cu toate cazurile
install.bat                    instalare de la zero
update.bat                     recompilare si reinstalare
git_publish.bat                publicare pe GitHub
```
