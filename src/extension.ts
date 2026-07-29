import * as vscode from 'vscode';
import { AutoCloseOptions, computeClosingTag } from './freemarker';

/** Cate caractere inaintea cursorului inspectam ca sa gasim inceputul tagului. */
const LOOKBEHIND = 4000;

/**
 * VS Code actualizeaza selectia editorului dupa ce trimite evenimentul de schimbare
 * a documentului, deci amanam putin verificarea pozitiei cursorului.
 */
const DEBOUNCE_MS = 25;

let output: vscode.OutputChannel | undefined;
let pending: NodeJS.Timeout | undefined;

export function activate(context: vscode.ExtensionContext): void {
  output = vscode.window.createOutputChannel('FreeMarker Auto-Close');
  context.subscriptions.push(
    output,
    vscode.workspace.onDidChangeTextDocument(onDidChangeTextDocument),
    vscode.commands.registerCommand('freemarkerAutoClose.toggle', toggle),
    vscode.commands.registerCommand('freemarkerAutoClose.showLog', () => output?.show(true))
  );
  log('Extensia FreeMarker Auto-Close a pornit.');
}

export function deactivate(): void {
  if (pending !== undefined) {
    clearTimeout(pending);
    pending = undefined;
  }
}

function log(message: string): void {
  output?.appendLine(message);
}

function debugEnabled(document?: vscode.TextDocument): boolean {
  return vscode.workspace
    .getConfiguration('freemarkerAutoClose', document?.uri)
    .get<boolean>('debug', false);
}

function trace(document: vscode.TextDocument, message: string): void {
  if (debugEnabled(document)) {
    log(message);
  }
}

function onDidChangeTextDocument(event: vscode.TextDocumentChangeEvent): void {
  if (
    event.reason === vscode.TextDocumentChangeReason.Undo ||
    event.reason === vscode.TextDocumentChangeReason.Redo
  ) {
    return;
  }
  if (event.contentChanges.length !== 1) {
    return;
  }

  const change = event.contentChanges[0];
  if (change.text !== '>' || change.rangeLength !== 0) {
    return;
  }

  const document = event.document;
  const config = vscode.workspace.getConfiguration('freemarkerAutoClose', document.uri);
  if (config.get<boolean>('enabled', true) !== true) {
    trace(document, 'Ignorat: extensia este dezactivata din setari.');
    return;
  }
  if (!appliesTo(document, config)) {
    trace(
      document,
      `Ignorat: ${document.uri.path} (limbaj "${document.languageId}") nu intra in lista de fisiere vizate.`
    );
    return;
  }

  const cursorOffset = change.rangeOffset + change.text.length;
  const version = document.version;

  if (pending !== undefined) {
    clearTimeout(pending);
  }
  pending = setTimeout(() => {
    pending = undefined;
    tryAutoClose(document, cursorOffset, version);
  }, DEBOUNCE_MS);
}

function tryAutoClose(
  document: vscode.TextDocument,
  cursorOffset: number,
  version: number
): void {
  const editor = vscode.window.activeTextEditor;
  if (editor === undefined || editor.document !== document) {
    return;
  }
  if (document.version !== version) {
    // s-a mai tastat ceva intre timp
    return;
  }
  if (editor.selections.length !== 1 || !editor.selection.isEmpty) {
    return;
  }
  const cursor = editor.selection.active;
  if (document.offsetAt(cursor) !== cursorOffset) {
    trace(document, 'Ignorat: cursorul nu se afla imediat dupa caracterul tastat.');
    return;
  }

  const textBefore = document.getText(
    new vscode.Range(document.positionAt(Math.max(0, cursorOffset - LOOKBEHIND)), cursor)
  );

  const config = vscode.workspace.getConfiguration('freemarkerAutoClose', document.uri);
  const closingTag = computeClosingTag(textBefore, readOptions(config));
  if (closingTag === null) {
    trace(document, `Fara inchidere pentru: ${JSON.stringify(textBefore.slice(-60))}`);
    return;
  }
  if (alreadyClosed(document, cursorOffset, closingTag)) {
    trace(document, `Ignorat: ${closingTag} exista deja imediat dupa cursor.`);
    return;
  }

  trace(document, `Inserez ${closingTag}`);
  void editor.insertSnippet(
    new vscode.SnippetString('$0' + escapeSnippet(closingTag)),
    cursor,
    { undoStopBefore: false, undoStopAfter: true }
  );
}

function readOptions(config: vscode.WorkspaceConfiguration): AutoCloseOptions {
  return {
    closeDirectives: config.get<boolean>('closeDirectives', true),
    closeUserDirectives: config.get<boolean>('closeUserDirectives', true),
    closeHtmlTags: config.get<boolean>('closeHtmlTags', true),
    extraBlockDirectives: config.get<string[]>('extraBlockDirectives', []),
    ignoredDirectives: config.get<string[]>('ignoredDirectives', [])
  };
}

function appliesTo(
  document: vscode.TextDocument,
  config: vscode.WorkspaceConfiguration
): boolean {
  const extensions = config.get<string[]>('fileExtensions', []);
  const match = /\.([^.\\/]+)$/.exec(document.uri.path);
  if (match !== null) {
    const ext = match[1].toLowerCase();
    if (extensions.some((e) => e.replace(/^\./, '').toLowerCase() === ext)) {
      return true;
    }
  }
  const languages = config.get<string[]>('languages', []);
  return languages.includes(document.languageId);
}

/** Nu insera daca acelasi tag de inchidere se afla deja imediat dupa cursor. */
function alreadyClosed(
  document: vscode.TextDocument,
  cursorOffset: number,
  closingTag: string
): boolean {
  const end = Math.min(document.getText().length, cursorOffset + closingTag.length + 40);
  const after = document.getText(
    new vscode.Range(document.positionAt(cursorOffset), document.positionAt(end))
  );
  return after.trimStart().startsWith(closingTag);
}

function escapeSnippet(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/\$/g, '\\$').replace(/\}/g, '\\}');
}

async function toggle(): Promise<void> {
  const config = vscode.workspace.getConfiguration('freemarkerAutoClose');
  const enabled = config.get<boolean>('enabled', true);
  await config.update('enabled', !enabled, vscode.ConfigurationTarget.Global);
  void vscode.window.showInformationMessage(
    `FreeMarker auto-close: ${!enabled ? 'pornit' : 'oprit'}`
  );
}
