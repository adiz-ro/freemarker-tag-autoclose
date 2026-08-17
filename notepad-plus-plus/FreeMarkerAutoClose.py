# -*- coding: utf-8 -*-
"""
Inchide automat tagurile FreeMarker/HTML in fisierele .ftl si .ftx, la fel ca
extensia VS Code din acest repo (vezi ../src/freemarker.ts - logica de mai jos
este o portare 1:1 a acelui fisier).

Instalare: Plugins > Python Script > Show Console (ca sa vezi erorile), apoi
Plugins > Python Script > New Script, numeste-l FreeMarkerAutoClose.py si
inlocuieste continutul cu acest fisier. Sau copiaza direct fisierul in
%APPDATA%\\Notepad++\\plugins\\Config\\PythonScript\\scripts\\.

Ca sa porneasca automat: Plugins > Python Script > Configuration, selecteaza
FreeMarkerAutoClose.py din lista, seteaza Initialisation pe ATSTARTUP, OK,
apoi restart Notepad++.

Detalii complete: Readme_ro.md / README.md, sectiunea "Inchiderea automata a
tagurilor in Notepad++".
"""

import os
import re

from Npp import editor, notepad, SCINTILLANOTIFICATION

# ---------------------------------------------------------------------------
# Configurare (echivalentul setarilor freemarkerAutoClose.* din VS Code)
# ---------------------------------------------------------------------------

FILE_EXTENSIONS = ('.ftl', '.ftx')

CLOSE_DIRECTIVES = True
CLOSE_USER_DIRECTIVES = True
CLOSE_HTML_TAGS = True

# Directive proprii de inchis, in plus fata de BLOCK_DIRECTIVES de mai jos.
EXTRA_BLOCK_DIRECTIVES = set()

# Directive/elemente de ignorat, ex: {'sep'} sau {'div'}.
IGNORED_DIRECTIVES = set()

# Cate caractere inainte de cursor se cauta pentru inceputul tagului. Un tag
# mai lung de atat (foarte rar) nu va fi inchis automat.
LOOKBACK = 8000

# ---------------------------------------------------------------------------
# Logica pura, portata din src/freemarker.ts
# ---------------------------------------------------------------------------

BLOCK_DIRECTIVES = {
    'if', 'list', 'items', 'sep', 'macro', 'function', 'attempt', 'compress',
    'escape', 'noescape', 'noparse', 'switch', 'outputformat', 'autoesc',
    'noautoesc', 'transform',
}

ASSIGNMENT_DIRECTIVES = {'assign', 'global', 'local'}

VOID_ELEMENTS = {
    'area', 'base', 'basefont', 'bgsound', 'br', 'col', 'embed', 'frame',
    'hr', 'img', 'input', 'isindex', 'keygen', 'link', 'meta', 'param',
    'source', 'track', 'wbr',
}

DIRECTIVE_NAME = re.compile(r'^<#([a-zA-Z_][a-zA-Z0-9_]*)')
USER_DIRECTIVE_NAME = re.compile(
    r'^<@([a-zA-Z_$][a-zA-Z0-9_$]*(?:\.[a-zA-Z_$][a-zA-Z0-9_$]*)*)'
)
HTML_TAG_NAME = re.compile(r'^<([a-zA-Z][a-zA-Z0-9._:-]*)(?=[\s/>])')
RAW_TEXT_BOUNDARY = re.compile(r'<(/?)(?:script|style)\b', re.IGNORECASE)


def find_tag_end(text, start):
    """Indexul lui '>' care inchide tagul deschis la `start`, sarind peste
    string-uri si peste '>' aflati intre paranteze (`<#if (a > b)>`)."""
    depth = 0
    quote = None
    raw = False
    i = start + 1
    n = len(text)
    while i < n:
        ch = text[i]
        if quote is not None:
            if ch == '\\' and not raw:
                i += 1
            elif ch == quote:
                quote = None
            i += 1
            continue
        if ch == '"' or ch == "'":
            quote = ch
            raw = i > 0 and text[i - 1] in ('r', 'R')
            i += 1
            continue
        if ch in '([{':
            depth += 1
            i += 1
            continue
        if ch in ')]}':
            if depth > 0:
                depth -= 1
            i += 1
            continue
        if ch == '>' and depth == 0:
            return i
        i += 1
    return -1


def has_assignment(params):
    """True daca parametrii contin o atribuire de nivel superior (`x = 1`)."""
    depth = 0
    quote = None
    i = 0
    n = len(params)
    while i < n:
        ch = params[i]
        if quote is not None:
            if ch == '\\':
                i += 1
            elif ch == quote:
                quote = None
            i += 1
            continue
        if ch == '"' or ch == "'":
            quote = ch
            i += 1
            continue
        if ch in '([{':
            depth += 1
            i += 1
            continue
        if ch in ')]}':
            if depth > 0:
                depth -= 1
            i += 1
            continue
        if ch == '=' and depth == 0:
            prev = params[i - 1] if i > 0 else None
            nxt = params[i + 1] if i + 1 < n else None
            if nxt == '=' or (prev is not None and prev in '=!<>+-*/%'):
                i += 1
                continue
            return True
        i += 1
    return False


def inside_raw_text_element(text):
    """True daca `text` se termina in interiorul unui <script> sau <style>."""
    inside = False
    for m in RAW_TEXT_BOUNDARY.finditer(text):
        inside = m.group(1) != '/'
    return inside


def compute_closing_tag(text_before_cursor):
    """Primeste textul terminat cu '>' tocmai tastat si intoarce tagul de
    inchidere de inserat, sau None."""
    end = len(text_before_cursor) - 1
    if end < 1 or text_before_cursor[end] != '>':
        return None
    if text_before_cursor[end - 1] == '/':
        return None

    start = text_before_cursor.rfind('<', 0, end)
    if start < 0:
        return None
    if find_tag_end(text_before_cursor, start) != end:
        return None

    tag = text_before_cursor[start:end + 1]
    if len(tag) < 2:
        return None

    def close(name):
        return '</%s>' % name

    if tag[1] == '#':
        if not CLOSE_DIRECTIVES:
            return None
        m = DIRECTIVE_NAME.match(tag)
        if m is None:
            return None
        name = m.group(1)
        if name in IGNORED_DIRECTIVES:
            return None
        if name in BLOCK_DIRECTIVES or name in EXTRA_BLOCK_DIRECTIVES:
            return close('#' + name)
        if name in ASSIGNMENT_DIRECTIVES:
            params = tag[m.end():len(tag) - 1]
            return None if has_assignment(params) else close('#' + name)
        return None

    if tag[1] == '@':
        if not CLOSE_USER_DIRECTIVES:
            return None
        um = USER_DIRECTIVE_NAME.match(tag)
        if um is not None:
            return None if um.group(1) in IGNORED_DIRECTIVES else close('@' + um.group(1))
        return close('@') if len(tag) > 2 and tag[2] == '(' else None

    if not CLOSE_HTML_TAGS:
        return None
    if inside_raw_text_element(text_before_cursor[:start]):
        return None
    hm = HTML_TAG_NAME.match(tag)
    if hm is None:
        return None
    element = hm.group(1)
    if element.lower() in VOID_ELEMENTS or element.lower() in IGNORED_DIRECTIVES:
        return None
    return close(element)


# ---------------------------------------------------------------------------
# Integrare cu Notepad++ / Scintilla
# ---------------------------------------------------------------------------

_inserting = False


def _is_freemarker_file():
    filename = notepad.getCurrentFilename()
    ext = os.path.splitext(filename)[1].lower()
    return ext in FILE_EXTENSIONS


def _on_char_added(args):
    global _inserting
    if _inserting:
        return
    if args.get('ch') != ord('>'):
        return
    if not _is_freemarker_file():
        return

    pos = editor.getCurrentPos()
    window_start = max(0, pos - LOOKBACK)
    text_before_cursor = editor.getTextRange(window_start, pos)

    closing_tag = compute_closing_tag(text_before_cursor)
    if not closing_tag:
        return

    # nu insera daca acelasi tag de inchidere e deja imediat dupa cursor
    doc_len = editor.getLength()
    after = editor.getTextRange(pos, min(doc_len, pos + len(closing_tag)))
    if after == closing_tag:
        return

    _inserting = True
    try:
        editor.insertText(pos, closing_tag)
    finally:
        _inserting = False


editor.callback(_on_char_added, [SCINTILLANOTIFICATION.CHARADDED])
