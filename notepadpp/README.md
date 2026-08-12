# FreeMarker for Notepad++

*Versiunea in romana: [Readme_ro.md](Readme_ro.md).*

`freemarker.udl.xml` is a **User Defined Language** that brings the same syntax rules to
Notepad++ as the VS Code extension in this repo: FreeMarker on top of HTML, with CSS and
JavaScript in the same file. Once installed, `FreeMarker` shows up in the **Language**
menu and `.ftl` / `.ftx` files are highlighted automatically when opened.

Requirements: Notepad++ 8.x (UDL 2.1 format). Light theme, white background.

## Installation

The quick way, no dialogs:

1. Close Notepad++.
2. Copy `freemarker.udl.xml` into `%APPDATA%\Notepad++\userDefineLangs\`
   (usually `C:\Users\<user>\AppData\Roaming\Notepad++\userDefineLangs\`).
3. Start Notepad++.

Step 2 from a terminal:

```bash
copy notepadpp\freemarker.udl.xml "%APPDATA%\Notepad++\userDefineLangs\"
```

Through the UI, if you prefer:

**Language** -> **User Defined Language** -> **Define your language...** -> **Import...**
-> pick `freemarker.udl.xml` -> restart Notepad++.

To check it works, open `sample.ftl` from the project root. The status bar at the bottom
should read **FreeMarker**, HTML tags should be blue, attributes red, the `<#-- ... -->`
comment green, and `+`/`-` fold markers should appear in the left margin next to `<#if>`,
`<#list>` and `<#macro>`.

If the file still opens with the HTML lexer, `ftl` and `ftx` are registered as user
extensions for the HTML language (**Settings -> Preferences -> Language**, the list on the
right, bottom field). Remove them there and the UDL takes over.

To uninstall: delete the file from `userDefineLangs` and restart Notepad++.

## What gets colored

The palette is copied from the Notepad++ HTML lexer (`stylers.model.xml`, `LexerType
name="html"`), so switching between **Language -> H -> HTML** and **FreeMarker** does not
change how the HTML looks. The vocabulary comes from Notepad++ sources as well:
`langs.model.xml`, `instre1` for `html` (split into tags and attributes), plus
`javascript` and `css`.

| Element | Example | Notepad++ style | Color |
| --- | --- | --- | --- |
| HTML tags | `div`, `/div`, `<`, `>`, `/` | TAG | blue `0000FF` |
| HTML attributes | `class`, `href`, `src`, `type` | ATTRIBUTE | red `FF0000` |
| Strings, attribute values | `"text"` / `'text'` | DOUBLE / SINGLE STRING | purple `8000FF` |
| Numbers | `42`, `3.14` | NUMBER | red `FF0000` |
| Plain text | text between tags | DEFAULT | black |
| JavaScript | `function`, `const`, `return` | JS KEYWORD | navy `000080` |
| CSS | `@media`, `display`, `background-color` | CSS IDENTIFIER | `8080C0` |
| FreeMarker directives | `#if`, `#assign`, `/#list` | USER TAGS1 | purple `6424DB`, bold italic |
| Macro calls | `@ui.button`, `@card` | TAG UNKNOWN | green `008040` |
| Built-ins | `?upper_case`, `?size` | - | `6424DB`, italic |
| Word operators | `as`, `in`, `gt`, `and`, `not`, `true` | - | `000080`, bold |
| Interpolations | `${name}`, `#{price}` | - | `6424DB` on cream `FEFDE0` |
| Comments | `<#-- ... -->` | COMMENT | green `008000` |

The first seven rows are exactly the HTML lexer styles. The rest are things the HTML lexer
knows nothing about; their colors still come from its palette - `6424DB` is the very color
already used by `USER TAGS1`, where FreeMarker directives are listed.

Directives and interpolations are colored **inside** HTML attributes too, so
`class="<#if active>on</#if>"` and `href="${url}"` look right - the equivalent of the
injection grammar in the VS Code extension.

A `>` inside an expression breaks nothing: `<#if (products?size > 1)>` stays highlighted to
the end, because directives are tokens, not `<#` ... `>` delimiters.

### Why keywords are written `#if` and not `<#if`

The UDL lexer splits text into tokens at every operator and every space, then compares the
**whole token** against the keyword lists. Since `<` and `>` are operators,
`<div class=...>` breaks into `<`, `div`, `class`, ... - so a keyword written `<div` never
matches and the tag stays black. Hence:

- tag names are plain words (`div`), plus the closing form (`/div`);
- `<`, `>` and `/` are themselves in the tag list, so they come out blue as well;
- directives are `#if`, `/#if` - not `<#if`, `</#if>`;
- `/` was removed from the operator list, otherwise `/div` and `/#if` would not be whole
  tokens.

Keep this rule in mind if you edit the lists through the UI - otherwise new entries will
have no effect at all.

## Folding

The block directives from `src/freemarker.ts` fold: `#if`, `#list`, `#macro`, `#function`,
`#attempt`, `#compress`, `#escape`, `#noescape`, `#noparse`, `#switch`, `#outputformat`,
`#autoesc`, `#noautoesc`, `#transform`. `#else`, `#elseif`, `#recover`, `#case`,
`#default`, `#items` and `#sep` are middle markers - they do not open a new level.

`#assign` is left out of folding: the block form `<#assign body>` and the assignment form
`<#assign x = 1>` cannot be told apart without a parser, and including it would corrupt the
levels.

**HTML tags do not fold.** They would have to be listed as plain words (`div`, `/div`) too,
and then any `div`, `table` or `head` appearing in text, in an attribute or in a variable
name would open a phantom fold and the levels would drift. FreeMarker folding, which works
on `#name`, does not have that problem.

## Limitations, up front

UDL is a single-level lexer, not a grammar system like TextMate. That is where the
differences from the native HTML lexer come from:

1. **There is no context.** The HTML lexer knows whether a word sits inside a tag; UDL does
   not. Since tag names are plain words, a `div`, `p`, `table` or `a` in ordinary text, in a
   comment or in a variable name comes out blue. Likewise `class` and `width` stay red
   wherever they appear, and `display` stays blue outside a `<style>`. In practice this
   shows up mostly with short FreeMarker variables: in `<#list products as p>` the `p` is
   blue.
2. **There are no real embedded languages.** The JavaScript and CSS lexers do not run inside
   `<script>` and `<style>`; those are just the keyword lists from `langs.model.xml`. So you
   lose the light blue background of the JavaScript block, the `//` and `/* */` comments
   inside scripts, and CSS selector coloring.
3. **Words that are both a tag and an attribute** can only live in one list. `style`,
   `title`, `data`, `dir`, `list`, `cite` and `summary` are treated as attributes (red),
   because that is how they appear most often - which means `<style>` and `<title>` are red
   rather than blue. Moving one to the other list is easy, from `Keywords Lists`.
4. **Unquoted values and entities** (`&nbsp;`) stay plain text. The HTML lexer paints them
   orange on cream and black on cream respectively.
5. **Built-ins are matched by the `?` prefix**, so any `?name` gets colored - including
   made-up ones. Side effect: the `??` operator also gets the built-in color. Macros work
   the same way with the `@` prefix, so CSS `@media` comes out green.
6. **Comments are defined as a delimiter, not as "Comment"**, which means `Ctrl+Q` (Edit ->
   Comment/Uncomment) does not wrap text in `<#-- -->` and comments cannot be folded. The
   reason is a lexer defect: with the comment in the comment slot, every comment in the file
   pushes the fold markers one more line down. The green color is identical, only the
   mechanism behind it differs.
7. **Single quotes are global.** An apostrophe in ordinary text starts a string that runs to
   the next apostrophe. If that bothers you, delete `09' 10\ 11'` from the
   `<Keywords name="Delimiters">` line and save the file.

In exchange, compared to the HTML lexer you get exactly what this file exists for:
`<#-- -->` comments are green end to end, `${...}` interpolations are visible, `<@...>`
macros are no longer "unknown tags", and folding works on FreeMarker directives.

There is no automatic tag closing like in the VS Code extension - Notepad++ cannot do that
from a UDL. For that you would need the **XML Tools** plugin or
`Settings -> Preferences -> Auto-Completion`, and neither of them knows FreeMarker
directives.

## Customizing

The most comfortable way to change colors is **Language** -> **User Defined Language** ->
**Define your language...**, tabs `Folder & Default`, `Keywords Lists`, `Comment & Number`,
`Operators & Delimiters`. Notepad++ writes the changes back to
`userDefineLangs\freemarker.udl.xml` by itself.

To cover more file extensions, edit the `ext` attribute on the second meaningful line of
the file:

```xml
<UserLang name="FreeMarker" ext="ftl ftx ftlh ftlx" udlVersion="2.1">
```
