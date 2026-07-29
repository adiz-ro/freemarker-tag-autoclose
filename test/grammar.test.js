/**
 * Tokenizeaza mostre de cod cu gramatica reala (vscode-textmate + oniguruma) si
 * verifica scope-urile rezultate. Gramaticile HTML / JS / CSS sunt incarcate din
 * instalarea locala de VS Code; daca nu sunt gasite, testele care depind de ele
 * sunt sarite, dar cele pentru FreeMarker ruleaza oricum.
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const oniguruma = require('vscode-oniguruma');
const vsctm = require('vscode-textmate');

const ROOT = path.join(__dirname, '..');

function builtinGrammarDir() {
  const fromEnv = process.env.VSCODE_APP_ROOT;
  const candidates = [];
  if (fromEnv) {
    candidates.push(path.join(fromEnv, 'resources', 'app', 'extensions'));
  }
  try {
    const cmd = execFileSync('where', ['code'], { encoding: 'utf8' }).split(/\r?\n/)[0];
    if (cmd) {
      const installRoot = path.dirname(path.dirname(cmd));
      candidates.push(path.join(installRoot, 'resources', 'app', 'extensions'));
      for (const entry of fs.readdirSync(installRoot, { withFileTypes: true })) {
        if (entry.isDirectory()) {
          candidates.push(path.join(installRoot, entry.name, 'resources', 'app', 'extensions'));
        }
      }
    }
  } catch {
    // 'where' indisponibil sau VS Code neinstalat
  }
  return candidates.find((dir) => fs.existsSync(path.join(dir, 'html', 'syntaxes')));
}

const BUILTIN = builtinGrammarDir();

const GRAMMAR_FILES = {
  'text.html.freemarker': path.join(ROOT, 'syntaxes', 'freemarker.tmLanguage.json'),
  'freemarker.injection': path.join(ROOT, 'syntaxes', 'freemarker.injection.json')
};

if (BUILTIN !== undefined) {
  Object.assign(GRAMMAR_FILES, {
    'text.html.basic': path.join(BUILTIN, 'html', 'syntaxes', 'html.tmLanguage.json'),
    'source.js': path.join(BUILTIN, 'javascript', 'syntaxes', 'JavaScript.tmLanguage.json'),
    'source.css': path.join(BUILTIN, 'css', 'syntaxes', 'css.tmLanguage.json')
  });
}

const onigLib = oniguruma
  .loadWASM(fs.readFileSync(require.resolve('vscode-oniguruma/release/onig.wasm')).buffer)
  .then(() => ({
    createOnigScanner: (patterns) => new oniguruma.OnigScanner(patterns),
    createOnigString: (str) => new oniguruma.OnigString(str)
  }));

const registry = new vsctm.Registry({
  onigLib,
  loadGrammar: async (scopeName) => {
    const file = GRAMMAR_FILES[scopeName];
    if (file === undefined) {
      return null;
    }
    return vsctm.parseRawGrammar(fs.readFileSync(file, 'utf8'), file);
  },
  getInjections: (scopeName) =>
    scopeName === 'text.html.freemarker' ? ['freemarker.injection'] : undefined
});

let grammar;

test.before(async () => {
  grammar = await registry.loadGrammar('text.html.freemarker');
  assert.ok(grammar, 'gramatica FreeMarker nu a putut fi incarcata');
});

/** Intoarce lista de perechi [text, scopes] pentru un fragment de mai multe linii. */
function tokenize(source) {
  const tokens = [];
  let state = vsctm.INITIAL;
  for (const line of source.split('\n')) {
    const result = grammar.tokenizeLine(line, state);
    for (const token of result.tokens) {
      const text = line.substring(token.startIndex, token.endIndex).trim();
      if (text !== '') {
        tokens.push([text, token.scopes]);
      }
    }
    state = result.ruleStack;
  }
  return tokens;
}

/**
 * Scope-urile aplicate primului token care este exact `text`. Daca nu exista, se
 * cauta tokenul care il contine - un bloc de comentariu, de exemplu, este un
 * singur token pe toata linia.
 */
function scopesOf(source, text) {
  const tokens = tokenize(source);
  const hit =
    tokens.find(([value]) => value === text) ?? tokens.find(([value]) => value.includes(text));
  assert.ok(hit !== undefined, `tokenul ${JSON.stringify(text)} nu a fost gasit in: ${source}`);
  return hit[1];
}

function assertScope(source, text, expectedScope) {
  const scopes = scopesOf(source, text);
  assert.ok(
    scopes.some((s) => s === expectedScope || s.startsWith(expectedScope + '.')),
    `${JSON.stringify(text)} are scope-urile [${scopes.join(', ')}], asteptam ${expectedScope}`
  );
}

test('directivele sunt cuvinte cheie', () => {
  assertScope('<#if user??>', 'if', 'keyword.control.directive.freemarker');
  assertScope('<#list items as i>', 'list', 'keyword.control.directive.freemarker');
  assertScope('</#if>', 'if', 'keyword.control.directive.freemarker');
  assertScope('<#list items as i>', 'as', 'keyword.operator.word.freemarker');
});

test('apelurile de macro sunt functii', () => {
  assertScope('<@ui.button label="ok"/>', 'ui.button', 'entity.name.function');
  assertScope('</@ui.button>', 'ui.button', 'entity.name.function');
});

test('comentariile FreeMarker', () => {
  assertScope('<#-- ceva -->', 'ceva', 'comment.block.freemarker');
  const multiline = '<#--\n  ascuns <#if x> aici\n-->';
  assertScope(multiline, 'ascuns', 'comment.block.freemarker');
});

test('interpolarile si continutul lor', () => {
  assertScope('<p>${user.name}</p>', 'user', 'variable.other.freemarker');
  assertScope('<p>${user.name?upper_case}</p>', 'upper_case', 'support.function.builtin.freemarker');
  assertScope('<p>${x!"gol"}</p>', 'gol', 'string.quoted.double.freemarker');
  assertScope('<p>#{n}</p>', 'n', 'variable.other.freemarker');
});

test('siruri si numere in directive', () => {
  assertScope('<#assign n = 42>', '42', 'constant.numeric.freemarker');
  assertScope('<#assign s = "text">', 'text', 'string.quoted.double.freemarker');
  assertScope('<#assign b = true>', 'true', 'constant.language.freemarker');
});

test('semnul mai mare din paranteze nu incheie tagul', () => {
  // daca '>' ar inchide tagul, 'b' ar ajunge text HTML in loc de expresie FreeMarker
  assertScope('<#if (a > b)>text</#if>', 'b', 'variable.other.freemarker');
});

test('HTML-ul din jur este evidentiat', { skip: BUILTIN === undefined }, () => {
  assertScope('<div class="x">salut</div>', 'div', 'entity.name.tag');
});

test('JavaScript-ul din <script> este evidentiat', { skip: BUILTIN === undefined }, () => {
  const source = '<script>\n  const a = 1;\n</script>';
  assertScope(source, 'const', 'storage.type');
  assert.ok(
    scopesOf(source, 'const').some((s) => s.startsWith('source.js')),
    'codul din <script> nu este tokenizat ca JavaScript'
  );
});

test('FreeMarker inauntrul JavaScript-ului', { skip: BUILTIN === undefined }, () => {
  const source = '<script>\n  var n = ${count};\n  <#if debug>console.log(n);</#if>\n</script>';
  assertScope(source, 'count', 'variable.other.freemarker');
  assertScope(source, 'if', 'keyword.control.directive.freemarker');
});

test('FreeMarker inauntrul atributelor HTML', { skip: BUILTIN === undefined }, () => {
  assertScope('<a href="${url}">x</a>', 'url', 'variable.other.freemarker');
  assertScope('<div class="<#if on>activ</#if>">x</div>', 'if', 'keyword.control.directive.freemarker');
});

test('CSS-ul din <style> este evidentiat', { skip: BUILTIN === undefined }, () => {
  const source = '<style>\n  .a { color: red; }\n</style>';
  assert.ok(
    scopesOf(source, 'color').some((s) => s.startsWith('source.css')),
    'codul din <style> nu este tokenizat ca CSS'
  );
});
