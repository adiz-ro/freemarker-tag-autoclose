# Changelog

## 0.3.0

- Inchidere automata si pentru tagurile HTML: `<div>` -> `</div>`, inclusiv elemente
  proprii (`<my-widget>`) si cu prefix (`<svg:rect>`).
- Elementele fara continut (`br`, `img`, `input`, `meta`, `link` ...) nu se inchid.
- In interiorul unui `<script>` sau `<style>` nu se inchid taguri HTML, ca sa nu fie
  confundate cu operatori sau generice din JavaScript (`a < b`, `Array<string>`).
  Directivele FreeMarker raman active si acolo.
- Setare noua `freemarkerAutoClose.closeHtmlTags`.
- Scripturi: `install.bat`, `update.bat`, `git_publish.bat`.

## 0.2.1

- Limbajul are acum id propriu, `freemarker-adiz`, si se afiseaza in bara de stare ca
  **FreeMarker - adiz**. Astfel se vede dintr-o privire daca fisierul este preluat de
  aceasta extensie sau de alta care revendica tot `.ftl`.

## 0.2.0

- Adaugat syntax highlighting pentru `.ftl` si `.ftx`: FreeMarker peste HTML, cu
  JavaScript in `<script>` si CSS in `<style>`.
- Gramatica de injectie: directivele si interpolarile FreeMarker sunt evidentiate si
  inauntrul JavaScript-ului si al atributelor HTML.
- Configuratie de limbaj proprie: comentarii `<#-- -->`, folding pe blocuri si, in mod
  deliberat, fara auto-inchiderea perechii `<` -> `>` care intra in conflict cu
  inchiderea de taguri.
- Teste reale de tokenizare cu `vscode-textmate`, folosind gramaticile HTML/JS/CSS din
  instalarea locala de VS Code.

## 0.1.2

- Corectat: extensia era dezactivata in workspace-urile fara incredere (Restricted Mode),
  deci functiona doar in folderele marcate ca sigure. Declara acum `untrustedWorkspaces`
  si `virtualWorkspaces`.

## 0.1.1

- Corectat: inserarea nu se declansa niciodata, pentru ca pozitia cursorului era citita
  inainte ca VS Code sa o actualizeze. Verificarea se face acum dupa aplicarea editarii.
- Adaugat `freemarkerAutoClose.debug` si comanda `FreeMarker: Show Auto-Close Log`.

## 0.1.0

- Inchidere automata a directivelor FreeMarker si a apelurilor de macro la tastarea `>`.
- Tratare corecta a lui `>` din expresii (`<#if (a > b)>`) si din literalii string.
- `<#assign>` / `<#global>` / `<#local>` se inchid doar cand nu contin atribuire.
- Setari pentru limbaje, directive suplimentare si directive ignorate.
- Comanda `FreeMarker: Toggle Tag Auto-Close`.
