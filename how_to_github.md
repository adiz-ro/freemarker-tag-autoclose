# Cum public extensia pe GitHub

Ghid practic pentru repo-ul `adiz-ro/freemarker-tag-autoclose`.

---

## Pe scurt

| Vreau sa... | Rulez |
| --- | --- |
| Reconstruiesc si reinstalez local, fara sa public | `update.bat` |
| Lansez o versiune noua: build + instalare + publicare + tag | `build.bat patch "mesaj"` |
| Public doar codul, fara sa schimb versiunea | `git_publish.bat "mesaj"` |

---

## 1. Pregatirea, o singura data

### Git

Verifica daca il ai:

```bash
git --version
```

Daca lipseste, ia-l de la <https://git-scm.com/download/win>.

### Spune-i lui git cine esti

Fara asta, commit-urile esueaza:

```bash
git config --global user.name "Adrian Zamfira"
```

```bash
git config --global user.email "adiz@kubu.ro"
```

Verifici cu `git config --global --list`.

### Repo-ul pe GitHub

Ai doua variante.

**Varianta A - din browser.** Intri pe <https://github.com/new>, nume
`freemarker-tag-autoclose`, proprietar `adiz-ro`. Foarte important: creeaza-l **gol**,
fara README, fara `.gitignore` si fara licenta. Daca bifezi vreuna, GitHub face un
commit initial care intra in conflict cu istoricul tau local si primul push va fi
respins.

**Varianta B - lasa scriptul sa il creeze.** Pentru asta ai nevoie de utilitarul `gh`,
vezi sectiunea urmatoare. Cu `gh` instalat si autentificat, `git_publish.bat` creeaza
singur repo-ul si nu mai trebuie sa intri in browser.

### GitHub CLI, optional

```bash
winget install --id GitHub.cli
```

Va cere confirmare UAC. Dupa ce termina, **inchide si redeschide terminalul** - altfel
`gh` nu este inca in PATH.

Apoi te autentifici o singura data:

```bash
gh auth login
```

Alegi pe rand: **GitHub.com** -> **HTTPS** -> *authenticate with your GitHub
credentials* -> **Login with a web browser**. Iti da un cod de 8 caractere, il lipesti
in browser si gata.

Verifici cu:

```bash
gh auth status
```

---

## 2. Prima publicare

Dupa ce ai facut pasii de mai sus:

```bash
git_publish.bat "Prima versiune"
```

Scriptul face, in ordine: ruleaza testele, initializeaza repo-ul local daca nu exista,
adauga si comite tot, configureaza `origin` si trimite pe GitHub.

La prima autentificare, Git Credential Manager deschide o fereastra de login GitHub.
Accept-o - datele se salveaza si nu te mai intreaba data viitoare.

---

## 3. Lansarea unei versiuni noi

Asta e comanda de zi cu zi:

```bash
build.bat patch "Adaug inchiderea tagurilor HTML"
```

Face tot lantul: teste, incrementeaza versiunea din `package.json`, construieste
`.vsix`-ul, il instaleaza in VS Code, comite, face push si pune tag-ul git.

| Comanda | Efect |
| --- | --- |
| `build.bat` | patch, cu mesaj implicit `Release v0.3.1` |
| `build.bat patch "mesaj"` | `0.3.0` -> `0.3.1` |
| `build.bat minor "mesaj"` | `0.3.0` -> `0.4.0` |
| `build.bat major "mesaj"` | `0.3.0` -> `1.0.0` |
| `build.bat "mesaj"` | patch, cu mesajul dat |

Doua lucruri care conteaza in practica:

- **Testele ruleaza inainte de incrementare.** Daca pica, versiunea ramane neatinsa si
  nu se publica nimic. Nu ramai cu un `0.3.1` fantoma in `package.json`.
- **Daca build-ul reuseste dar push-ul esueaza**, versiunea noua este deja instalata
  local. Reiei doar publicarea, cu `git_publish.bat`.

Dupa fiecare lansare, in VS Code: `Ctrl+Shift+P` -> **Developer: Reload Window**.

### Cand folosesc `update.bat` in loc

Cand vrei doar sa reconstruiesti si sa reinstalezi local, ca sa testezi o modificare,
fara sa schimbi versiunea si fara sa publici nimic.

---

## 4. Din privat in public

Repo-ul a fost creat privat. Ca sa il faci public:

**Din browser:** repo -> **Settings** -> jos la **Danger Zone** ->
**Change repository visibility** -> **Change to public**. Iti cere sa tastezi numele
repo-ului pentru confirmare.

**Din terminal**, daca ai `gh`:

```bash
gh repo edit adiz-ro/freemarker-tag-autoclose --visibility public --accept-visibility-change-consequences
```

Flag-ul lung este obligatoriu - `gh` refuza schimbarea de vizibilitate fara el.

Schimba si in `git_publish.bat` linia `set "VISIBILITY=private"` in `public`. Altfel,
daca stergi vreodata repo-ul si rulezi scriptul din nou, ti-l recreeaza privat.

Inainte sa il faci public, doua lucruri:

- Devine public **tot istoricul**, nu doar starea curenta. Daca a existat vreodata un
  commit cu ceva ce nu vrei public, schimbarea vizibilitatii nu il ascunde.
- `prompt.md` contine istoricul conversatiei si toate cererile tale. Nu e nimic
  sensibil acolo, dar e continut personal care devine vizibil pentru oricine. Daca
  preferi sa nu fie, sterge-l sau adauga-l in `.gitignore` inainte de push.

Ce este acum in repo e curat: `node_modules`, `out/` si `*.vsix` sunt deja excluse prin
`.gitignore`, iar chei sau token-uri nu exista nicaieri in cod.

---

## 5. Cand ceva nu merge

### Push-ul este respins

Cauza aproape sigura: repo-ul de pe GitHub are commit-uri pe care local nu le ai. Se
intampla daca l-ai creat cu README bifat sau daca ai editat ceva direct in browser.

```bash
git pull --rebase origin main
```

Apoi rulezi din nou scriptul.

### "Repository not found"

Repo-ul nu exista inca pe GitHub, sau numele din script nu se potriveste. Verifica
liniile de configurare din capul lui `git_publish.bat`:

```bat
set "GH_USER=adiz-ro"
set "REPO_NAME=freemarker-tag-autoclose"
```

### Autentificarea esueaza

Sterge datele salvate si lasa-l sa te intrebe din nou: **Control Panel** ->
**Credential Manager** -> **Windows Credentials** -> cauta `git:https://github.com` ->
sterge intrarea. La urmatorul push se redeschide fereastra de login.

Cu `gh` instalat, alternativa este `gh auth login` din nou.

### "git nu stie cine esti"

Nu ai configurat identitatea. Vezi sectiunea 1.

### Testele pica si nu se publica nimic

Asta e intentionat. Ruleaza `npm test` ca sa vezi ce anume a picat, repara, si reia.

---

## 6. Ce NU fac scripturile

Ca sa nu fie surprize:

- **Nu publica pe VS Code Marketplace.** Pentru asta exista `publish_marketplace.bat`,
  descris mai jos.
- **Nu creeaza GitHub Releases.** Se pun doar tag-uri git. Daca vrei o pagina de
  release cu `.vsix`-ul atasat, o faci manual din interfata GitHub, la
  **Releases** -> **Draft a new release** -> alegi tag-ul existent.
- **Nu fac backup.** Un `git push` nu este o copie de siguranta a fisierelor ignorate.

---

## 7. Publicarea in directorul oficial VS Code

GitHub si Marketplace-ul sunt doua lucruri diferite. Pe GitHub sta codul sursa. Pe
Marketplace sta extensia gata construita, de unde o instaleaza oricine cu un click din
panoul Extensions al VS Code.

### Pregatirea, o singura data

**1. Creeaza publisher-ul.** Intri pe <https://marketplace.visualstudio.com/manage> cu
un cont Microsoft si creezi un publisher. ID-ul trebuie sa fie exact `adiz`, ca sa se
potriveasca cu campul `publisher` din `package.json`. Daca `adiz` este deja luat, alegi
altceva si schimbi si in `package.json`.

**2. Genereaza un token de acces.** Aici se impiedica toata lumea. Mergi pe
<https://dev.azure.com>, creeaza o organizatie daca nu ai, apoi
**User settings** -> **Personal access tokens** -> **New Token**:

- **Organization**: `All accessible organizations` - obligatoriu, altfel tokenul nu
  functioneaza pentru Marketplace
- **Scopes**: apasa *Show all scopes*, apoi bifeaza **Marketplace** -> **Manage**
- Expirare: maximum 1 an

Copiaza tokenul imediat, nu se mai afiseaza a doua oara.

**3. Autentifica-te:**

```bash
npx @vscode/vsce login adiz
```

Iti cere tokenul si il tine minte. Alternativ, pentru o singura sesiune, pui tokenul in
variabila de mediu `VSCE_PAT`.

### Publicarea

```bash
publish_marketplace.bat
```

Scriptul publica versiunea curenta din `package.json`, asa cum este. Cere o confirmare
explicita inainte, ruleaza testele si abia apoi trimite.

Daca vrei o versiune noua, incrementeaz-o intai:

```bash
build.bat patch "Ce am schimbat"
```

Ordinea fireasca a unei lansari complete este deci:

1. `build.bat patch "mesaj"` - versiune noua, build, instalare locala, GitHub
2. `publish_marketplace.bat` - aceeasi versiune, pe Marketplace

Extensia apare la cautare in VS Code in cateva minute, iar oricine o poate instala cu:

```bash
code --install-extension adiz.freemarker-tag-autoclose
```

### De retinut

Publicarea este practic definitiva. Poti retrage extensia cu `vsce unpublish`, dar
identificatorul `adiz.freemarker-tag-autoclose` ramane rezervat permanent si nu il mai
poate folosi nimeni, nici tu.

O versiune deja publicata nu poate fi inlocuita. Orice corectie inseamna o versiune
noua.

Repo-ul de pe GitHub ar fi bine sa fie public: pagina extensiei de pe Marketplace
afiseaza `README.md` si trimite spre repo, iar din privat linkurile duc la 404.

### Optional: Open VSX

VSCodium, Cursor si alte derivate nu au acces la Marketplace-ul Microsoft. Folosesc
<https://open-vsx.org>, un registru paralel cu propriul cont si token. Nu e obligatoriu,
dar daca vrei sa acoperi si publicul acela, extensia se publica acolo separat.
