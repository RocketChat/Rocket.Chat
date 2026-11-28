#!/usr/bin/env node
// Compare N-API codegen RD parser against TS Peggy parser

const path = require('path');
const fs = require('fs');
const Module = require('module');

const PARSER_PKG = path.resolve(__dirname, '..', '..', 'message-parser', 'src');

// Patch module resolution for the TS parser's utils import
const origResolve = Module._resolveFilename;
Module._resolveFilename = function (request, parent, ...args) {
  if (request === './utils' && parent && parent.filename && parent.filename.includes('message-parser')) {
    return path.join(PARSER_PKG, 'utils.ts');
  }
  return origResolve.call(this, request, parent, ...args);
};

// Build cached parser if needed
const cachePath = path.join(PARSER_PKG, '.parser-cache-tmp.cjs');
if (!fs.existsSync(cachePath)) {
  const peggy = require('peggy');
  const src = fs.readFileSync(path.join(PARSER_PKG, 'grammar.pegjs'), 'utf8');
  const code = peggy.generate(src, { output: 'source', format: 'commonjs', allowedStartRules: ['Start'] });
  fs.writeFileSync(cachePath, code);
}

const tsParser = require(cachePath);
const napiParser = require('../index');

const testCases = [
  'hello world',
  '**bold text**',
  '*bold too*',
  '_italic text_',
  '__italic too__',
  '~~strikethrough~~',
  '~strike too~',
  '`inline code`',
  ':smile:',
  ':rocket: :thumbsup:',
  '@user',
  '#channel',
  'Visit https://rocket.chat',
  '[Link](https://example.com)',
  '_italic @mention inside_',
  'hello **bold _italic_** world',
  'Plain text with no markup at all',
  'user@example.com',
  '<https://example.com|Example>',
  '**bold :emoji: text**',
  ':smile: :rocket: :thumbsup:',
  '||spoiler text||',
  'a__b__c',
  'word_not_italic_word',
  'test **bold** and _italic_ mix',
  'https://example.com/path?q=1&b=2',
];

let matches = 0;
const diffs = [];

for (const input of testCases) {
  let tsResult, napiResult;
  try {
    tsResult = JSON.parse(JSON.stringify(tsParser.parse(input)));
  } catch (e) {
    tsResult = `TS_ERROR: ${e.message}`;
  }
  try {
    napiResult = napiParser.parse(input);
  } catch (e) {
    napiResult = `NAPI_ERROR: ${e.message}`;
  }

  const tsJson = JSON.stringify(tsResult);
  const napiJson = JSON.stringify(napiResult);

  if (tsJson === napiJson) {
    matches++;
  } else {
    diffs.push({ input, ts: tsJson.slice(0, 300), napi: napiJson.slice(0, 300) });
  }
}

const total = matches + diffs.length;
console.log(`\n${matches}/${total} match (${(matches / total * 100).toFixed(1)}%)\n`);

if (diffs.length) {
  console.log('Diffs:');
  for (const d of diffs) {
    console.log(`  INPUT: ${JSON.stringify(d.input)}`);
    console.log(`    TS:   ${d.ts}`);
    console.log(`    NAPI: ${d.napi}`);
    console.log();
  }
}

// Quick benchmark
const msgs = testCases.filter((m) => !m.includes('\n'));
const N = 5000;

for (let i = 0; i < 500; i++) msgs.forEach((m) => { try { napiParser.parse(m); } catch {} });
for (let i = 0; i < 500; i++) msgs.forEach((m) => { try { tsParser.parse(m); } catch {} });

const t1 = process.hrtime.bigint();
for (let i = 0; i < N; i++) msgs.forEach((m) => { try { tsParser.parse(m); } catch {} });
const d1 = Number(process.hrtime.bigint() - t1);

const t2 = process.hrtime.bigint();
for (let i = 0; i < N; i++) msgs.forEach((m) => { try { napiParser.parse(m); } catch {} });
const d2 = Number(process.hrtime.bigint() - t2);

const tsUs = d1 / N / msgs.length / 1000;
const napiUs = d2 / N / msgs.length / 1000;
console.log(`TS Peggy:  ${tsUs.toFixed(2)} µs/msg`);
console.log(`N-API RD:  ${napiUs.toFixed(2)} µs/msg`);
console.log(`Speedup:   ${(tsUs / napiUs).toFixed(1)}x`);
