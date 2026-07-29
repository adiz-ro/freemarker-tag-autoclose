const test = require('node:test');
const assert = require('node:assert');
const { computeClosingTag, findTagEnd, hasAssignment } = require('../out/freemarker.js');

function closes(text, expected, options) {
  assert.strictEqual(computeClosingTag(text, options ?? undefined), expected);
}

test('directive bloc uzuale', () => {
  closes('<#if user??>', '</#if>');
  closes('<#list items as i>', '</#list>');
  closes('<#macro card title>', '</#macro>');
  closes('<#function sum a b>', '</#function>');
  closes('<#attempt>', '</#attempt>');
  closes('<#switch x>', '</#switch>');
  closes('<#noparse>', '</#noparse>');
  closes('<#escape x as x?html>', '</#escape>');
  closes('<#outputformat "HTML">', '</#outputformat>');
});

test('directive fara tag de inchidere', () => {
  closes('<#else>', null);
  closes('<#elseif x>', null);
  closes('<#break>', null);
  closes('<#return x>', null);
  closes('<#include "a.ftl">', null);
  closes('<#import "b.ftl" as b>', null);
  closes('<#ftl output_format="HTML">', null);
  closes('<#nested>', null);
  closes('<#case 1>', null);
  closes('<#default>', null);
  closes('<#recover>', null);
  closes('<#setting locale="ro_RO">', null);
});

test('assign / global / local depind de atribuire', () => {
  closes('<#assign x = 1>', null);
  closes('<#assign x=1>', null);
  closes('<#global y = "a">', null);
  closes('<#local z=[1,2]>', null);
  closes('<#assign body>', '</#assign>');
  closes('<#global header>', '</#global>');
  closes('<#local part>', '</#local>');
});

test('comparatiile nu sunt confundate cu atribuiri', () => {
  closes('<#assign x = (a == b)>', null);
  assert.strictEqual(hasAssignment(' x == y '), false);
  assert.strictEqual(hasAssignment(' x != y '), false);
  assert.strictEqual(hasAssignment(' x >= y '), false);
  assert.strictEqual(hasAssignment(' x = y '), true);
  assert.strictEqual(hasAssignment(' text = "a=b" '), true);
  assert.strictEqual(hasAssignment(' "a=b" '), false);
});

test('apeluri de macro', () => {
  closes('<@card>', '</@card>');
  closes('<@ui.button label="ok">', '</@ui.button>');
  closes('<@card />', null);
  closes('<@card/>', null);
  closes('<@(fn)>', '</@>');
});

test('comentariile si textul obisnuit sunt ignorate', () => {
  closes('<#-- comentariu -->', null);
  closes('text simplu >', null);
  closes('<#if a>text</#if>', null);
});

test('semnul mai mare din expresii nu inchide tagul prematur', () => {
  closes('<#if (a > b)>', '</#if>');
  closes('<#if a gt b>', '</#if>');
  closes('<#list xs?filter(x -> x.n > 3) as x>', '</#list>');
  // primul '>' inchide tagul; al doilea este text obisnuit
  closes('<#if a > b>', null);
  closes('<#if title == "a>b">', '</#if>');
});

test('taguri pe mai multe linii', () => {
  closes('<#list\n  items\n  as item>', '</#list>');
});

test('cursorul trebuie sa fie fix la finalul tagului', () => {
  assert.strictEqual(findTagEnd('<#if a>', 0), 6);
  assert.strictEqual(findTagEnd('<#if (a > b)>', 0), 12);
  assert.strictEqual(findTagEnd('<#if a', 0), -1);
});

test('taguri HTML obisnuite', () => {
  closes('<div>', '</div>');
  closes('<div class="a">', '</div>');
  closes('<span>', '</span>');
  closes('<table>', '</table>');
  closes('<my-widget>', '</my-widget>');
  closes('<svg:rect x="1">', '</svg:rect>');
  closes('<DIV>', '</DIV>');
  closes('<a href="${url}">', '</a>');
  closes('<div title="a>b">', '</div>');
});

test('elementele HTML fara continut nu se inchid', () => {
  for (const tag of ['br', 'hr', 'img src="a.png"', 'input type="text"', 'meta charset="utf-8"', 'link rel="x"']) {
    closes(`<${tag}>`, null);
  }
  closes('<BR>', null);
});

test('constructii care nu sunt taguri de deschidere', () => {
  closes('</div>', null);
  closes('<div />', null);
  closes('<div/>', null);
  closes('<!DOCTYPE html>', null);
  closes('<!-- comentariu -->', null);
  closes('<?xml version="1.0"?>', null);
});

test('nu inchide taguri HTML in interiorul <script> sau <style>', () => {
  closes('<script>\n  var s = "<div>', null);
  closes('<script>\n  /** @type {Array<string>} */', null);
  closes('<style>\n  .a { color: red; } <b>', null);
  // dupa inchiderea blocului, comportamentul revine la normal
  closes('<script>\n  var x = 1;\n</script>\n<div>', '</div>');
  // tagul <script> insusi trebuie inchis
  closes('<script>', '</script>');
  closes('<style>', '</style>');
  // directivele FreeMarker raman active si in interiorul scriptului
  closes('<script>\n  <#if debug>', '</#if>');
});

test('nu confunda operatorii din JavaScript cu taguri', () => {
  closes('<script>\n  const f = () => {}', null);
  closes('<script>\n  if (a < b) { c = 1; }\n  if (d > e)', null);
  closes('var t = a<b; var u = c>', null);
});

test('optiuni', () => {
  const off = {
    closeDirectives: false,
    closeUserDirectives: true,
    closeHtmlTags: true,
    extraBlockDirectives: [],
    ignoredDirectives: []
  };
  closes('<#if a>', null, off);
  closes('<@card>', '</@card>', off);
  closes('<div>', '</div>', off);

  const noHtml = {
    closeDirectives: true,
    closeUserDirectives: true,
    closeHtmlTags: false,
    extraBlockDirectives: [],
    ignoredDirectives: []
  };
  closes('<div>', null, noHtml);
  closes('<#if a>', '</#if>', noHtml);

  const custom = {
    closeDirectives: true,
    closeUserDirectives: true,
    closeHtmlTags: true,
    extraBlockDirectives: ['visit'],
    ignoredDirectives: ['sep', 'p']
  };
  closes('<#visit node>', '</#visit>', custom);
  closes('<#sep>', null, custom);
  closes('<p>', null, custom);
});
