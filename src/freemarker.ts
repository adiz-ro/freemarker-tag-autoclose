/**
 * Logica pura de detectie a tagurilor FreeMarker.
 * Nu depinde de API-ul VS Code, ca sa poata fi testata separat.
 */

/** Directive care au intotdeauna un tag de inchidere. */
export const BLOCK_DIRECTIVES: ReadonlySet<string> = new Set([
  'if',
  'list',
  'items',
  'sep',
  'macro',
  'function',
  'attempt',
  'compress',
  'escape',
  'noescape',
  'noparse',
  'switch',
  'outputformat',
  'autoesc',
  'noautoesc',
  'transform'
]);

/**
 * Directive care sunt bloc doar cand nu au atribuire.
 * `<#assign x = 1>` este de sine statatoare, `<#assign x>` deschide un bloc.
 */
export const ASSIGNMENT_DIRECTIVES: ReadonlySet<string> = new Set([
  'assign',
  'global',
  'local'
]);

/** Elemente HTML care nu au tag de inchidere. */
export const VOID_ELEMENTS: ReadonlySet<string> = new Set([
  'area',
  'base',
  'basefont',
  'bgsound',
  'br',
  'col',
  'embed',
  'frame',
  'hr',
  'img',
  'input',
  'isindex',
  'keygen',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr'
]);

export interface AutoCloseOptions {
  closeDirectives: boolean;
  closeUserDirectives: boolean;
  closeHtmlTags: boolean;
  extraBlockDirectives: readonly string[];
  ignoredDirectives: readonly string[];
}

export const DEFAULT_OPTIONS: AutoCloseOptions = {
  closeDirectives: true,
  closeUserDirectives: true,
  closeHtmlTags: true,
  extraBlockDirectives: [],
  ignoredDirectives: []
};

const DIRECTIVE_NAME = /^<#([a-zA-Z_][a-zA-Z0-9_]*)/;
const USER_DIRECTIVE_NAME = /^<@([a-zA-Z_$][a-zA-Z0-9_$]*(?:\.[a-zA-Z_$][a-zA-Z0-9_$]*)*)/;

/**
 * Numele unui element HTML. Lookahead-ul cere ca dupa nume sa urmeze spatiu, '/' sau
 * '>', ceea ce elimina potriviri accidentale de tipul `a<b; c>d` din JavaScript.
 */
const HTML_TAG_NAME = /^<([a-zA-Z][a-zA-Z0-9._:-]*)(?=[\s/>])/;

/**
 * Gaseste indexul lui '>' care inchide tagul care incepe la `start`.
 * Sare peste literalii string si peste `>` aflati intre paranteze,
 * ca `<#if (a > b)>` sa fie interpretat corect.
 */
export function findTagEnd(text: string, start: number): number {
  let depth = 0;
  let quote: string | null = null;
  let raw = false;

  for (let i = start + 1; i < text.length; i++) {
    const ch = text[i];

    if (quote !== null) {
      if (ch === '\\' && !raw) {
        i++;
      } else if (ch === quote) {
        quote = null;
      }
      continue;
    }

    if (ch === '"' || ch === "'") {
      quote = ch;
      raw = i > 0 && (text[i - 1] === 'r' || text[i - 1] === 'R');
      continue;
    }
    if (ch === '(' || ch === '[' || ch === '{') {
      depth++;
      continue;
    }
    if (ch === ')' || ch === ']' || ch === '}') {
      if (depth > 0) {
        depth--;
      }
      continue;
    }
    if (ch === '>' && depth === 0) {
      return i;
    }
  }

  return -1;
}

/** Adevarat daca parametrii contin o atribuire de nivel superior (`x = 1`). */
export function hasAssignment(params: string): boolean {
  let depth = 0;
  let quote: string | null = null;

  for (let i = 0; i < params.length; i++) {
    const ch = params[i];

    if (quote !== null) {
      if (ch === '\\') {
        i++;
      } else if (ch === quote) {
        quote = null;
      }
      continue;
    }

    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }
    if (ch === '(' || ch === '[' || ch === '{') {
      depth++;
      continue;
    }
    if (ch === ')' || ch === ']' || ch === '}') {
      if (depth > 0) {
        depth--;
      }
      continue;
    }
    if (ch === '=' && depth === 0) {
      const prev = params[i - 1];
      const next = params[i + 1];
      // sare peste ==, !=, <=, >=, +=, -=, *=, /=, %=
      if (next === '=' || (prev !== undefined && '=!<>+-*/%'.includes(prev))) {
        continue;
      }
      return true;
    }
  }

  return false;
}

/** Gaseste ultimul '<' din text, inainte de `before`. */
function findTagStart(text: string, before: number): number {
  return text.lastIndexOf('<', before - 1);
}

/**
 * Adevarat daca textul se termina in interiorul unui `<script>` sau `<style>`.
 * Acolo nu inchidem taguri HTML: un `<` din JavaScript este aproape intotdeauna o
 * comparatie sau un generic (`Array<string>`), nu un element.
 */
export function insideRawTextElement(text: string): boolean {
  const boundary = /<(\/?)(?:script|style)\b/gi;
  let inside = false;
  let match: RegExpExecArray | null;
  while ((match = boundary.exec(text)) !== null) {
    inside = match[1] !== '/';
  }
  return inside;
}

/**
 * Primeste textul care se termina cu caracterul '>' tocmai tastat si intoarce
 * tagul de inchidere care ar trebui inserat, sau `null` daca nu e cazul.
 */
export function computeClosingTag(
  textBeforeCursor: string,
  options: AutoCloseOptions = DEFAULT_OPTIONS
): string | null {
  const end = textBeforeCursor.length - 1;
  if (end < 1 || textBeforeCursor[end] !== '>') {
    return null;
  }
  // tag inchis explicit: <@macro /> sau <#macro ... />
  if (textBeforeCursor[end - 1] === '/') {
    return null;
  }

  const start = findTagStart(textBeforeCursor, end);
  if (start < 0) {
    return null;
  }
  // '>'-ul tastat trebuie sa fie chiar sfarsitul acestui tag
  if (findTagEnd(textBeforeCursor, start) !== end) {
    return null;
  }

  const tag = textBeforeCursor.slice(start, end + 1);
  const close = (name: string): string => `</${name}>`;
  const ignored = new Set(options.ignoredDirectives.map((n) => n.replace(/^#/, '')));

  if (tag[1] === '#') {
    if (!options.closeDirectives) {
      return null;
    }
    const match = DIRECTIVE_NAME.exec(tag);
    if (match === null) {
      // <#-- comentariu --> si alte constructii care nu sunt directive
      return null;
    }
    const name = match[1];
    if (ignored.has(name)) {
      return null;
    }

    const extra = new Set(options.extraBlockDirectives.map((n) => n.replace(/^#/, '')));
    if (BLOCK_DIRECTIVES.has(name) || extra.has(name)) {
      return close(`#${name}`);
    }
    if (ASSIGNMENT_DIRECTIVES.has(name)) {
      const params = tag.slice(match[0].length, tag.length - 1);
      return hasAssignment(params) ? null : close(`#${name}`);
    }
    return null;
  }

  if (tag[1] === '@') {
    if (!options.closeUserDirectives) {
      return null;
    }
    const userMatch = USER_DIRECTIVE_NAME.exec(tag);
    if (userMatch !== null) {
      return ignored.has(userMatch[1]) ? null : close(`@${userMatch[1]}`);
    }
    // <@(expresie)> se inchide cu forma anonima
    return tag[2] === '(' ? close('@') : null;
  }

  // tag HTML obisnuit: <div>, <my-widget>, <svg:rect>
  if (!options.closeHtmlTags) {
    return null;
  }
  if (insideRawTextElement(textBeforeCursor.slice(0, start))) {
    return null;
  }
  const htmlMatch = HTML_TAG_NAME.exec(tag);
  if (htmlMatch === null) {
    // </div>, <!-- -->, <!DOCTYPE ...>, <?xml ... ?>
    return null;
  }
  const element = htmlMatch[1];
  if (VOID_ELEMENTS.has(element.toLowerCase())) {
    return null;
  }
  if (ignored.has(element.toLowerCase())) {
    return null;
  }
  return close(element);
}
