/*
Simple micro-benchmark for the message parser.
Runs a set of representative inputs repeatedly and reports ops/sec.
*/

import { parse } from '../src/index.ts';
import { performance } from 'node:perf_hooks';

function runCase(label: string, input: string, iterations = 2000) {
  const start = performance.now();
  let total = 0;
  for (let i = 0; i < iterations; i++) {
    // Touch the AST length to prevent dead-code elimination
    const ast = parse(input);
    total += ast.length;
  }
  const ms = performance.now() - start;
  const ops = (iterations / ms) * 1000;
  return { label, ms, iterations, ops, total };
}

function main() {
  const cases = [
    ['plain', 'This is a simple message with no formatting.'],
    [
      'plain-ascii-fast',
      'Just some words, commas, and spaces without any triggers or unicode',
    ],
    [
      'mixed',
      'Hello @john! Check https://rocket.chat and :smile: **bold** _italic_ ~~del~~ <t:1720569600:D>\n- [x] task one\n- [ ] task two\n> quote\n1. first\n2. second',
    ],
    [
      'mentions-and-channels',
      '@alice please check with @bob in #general and #random about release 1.2.3',
    ],
    [
      'lists-and-quotes',
      '- item one\n- item two\n> quoted line\n> another quoted line',
    ],
    [
      'multilingual',
      'Olá mundo — こんにちは世界 — Привет мир — مرحبا بالعالم 🌍',
    ],
    [
      'long-plain',
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(20),
    ],
    [
      'markdown-noise',
      '*not emphasis at start of sentence* but star in middle* and _underscores_ here',
    ],
    ['emoji-heavy', '😀😀😀 😀👍🏽🎉 #channel :rocket: :+1:'],
    [
      'urls',
      'Visit http://example.com, https://foo.bar/baz?x=1 and mailto:test@example.com',
    ],
    [
      'code',
      'Use `inline` and ![alt](http://img) and [link](tel:+1-202-555-0123)',
    ],
  ] as const;

  const results = cases.map(([label, input]) => runCase(label, input, 3000));
  const lines = results.map(
    (r) => `${r.label}: ${r.ops.toFixed(1)} ops/sec (${r.ms.toFixed(1)} ms)`,
  );
  // eslint-disable-next-line no-console
  console.log(lines.join('\n'));
}

main();
