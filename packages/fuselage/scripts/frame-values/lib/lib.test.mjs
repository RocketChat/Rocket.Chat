import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import { moduleProblems, transformProblems } from './check.mts';
import { generateFrameValues } from './generate.mts';
import { literal } from './literal.mts';
import { END, START } from './markers.mts';
import { offScale, radius, space, themed, unresolvedReferences, zIndex } from './tokens.mts';

test('literal quotes keys, nests and skips undefined', () => {
	assert.equal(literal({ 'a-b': 1, 'c': { d: 'x', e: undefined } }), '{\n\t"a-b": 1,\n\t"c": {\n\t\t"d": "x",\n\t},\n}');
});

test('a color is a theme key, a length or a layer a token of its category', () => {
	assert.equal(themed('font-default'), '$rcx-font-default');
	assert.equal(space('x8'), '$space.x8');
	assert.equal(radius('zero'), '$radius.zero');
	assert.equal(zIndex('overlay'), '$zIndex.overlay');
});

test('every reference the helpers write for a name the config has resolves', () => {
	const body = [themed('button-font-on-secondary-danger-disabled'), space('x40'), radius('full'), zIndex('raised')].join();

	assert.deepEqual(unresolvedReferences(body), []);
});

test('a reference the config lacks is unresolved, whoever wrote it', () => {
	const body = `{ color: '${themed('typo')}', gap: '${space('x5')}', radius: '$radius.none', margin: '$x8', top: '$space.x8' }`;

	assert.deepEqual(unresolvedReferences(body), ['$rcx-typo', '$space.x5', '$radius.none', '$x8']);
});

test('offScale refuses a length the spacing scale has, and accepts one it has not', () => {
	assert.throws(() => offScale(4), /use space\('x4'\)/);
	assert.equal(offScale(2), 2);
	assert.equal(offScale(-1), -1);
});

test('a CSS custom property in a generator module is a problem', () => {
	assert.equal(moduleProblems('m.mts', "const a = { color: themed('font-default'), gap: space('x8') };").length, 0);
	assert.match(
		moduleProblems('m.mts', "const a = {\n\tcolor: 'var(--rcx-color-font-default, #2f343d)' };")[0],
		/^m\.mts:2: `var\(--rcx-color-font-default`/,
	);
	assert.equal(moduleProblems('m.mts', "const a = { transform: 'rotate(calc(90deg * var(--rcx-dir)))' };").length, 1);
	assert.equal(moduleProblems('m.mts', "const a = { color: 'var(--other-color)' };").length, 1);
	assert.equal(moduleProblems('m.mts', "const a = { '--other': 1 };").length, 1);
});

test('a length with a CSS unit in a generator module is a problem, a unitless one is not', () => {
	assert.equal(moduleProblems('m.mts', 'const a = { paddingBlock: offScale(2), borderWidth: 1 };').length, 0);
	assert.equal(moduleProblems('m.mts', "const a = { paddingInline: '12px' };").length, 1);
	assert.equal(moduleProblems('m.mts', "const a = { fontSize: '0.875rem' };").length, 1);
	assert.equal(moduleProblems('m.mts', "const a = { maxHeight: '50vh', width: '2ch', height: '100%' };").length, 3);
});

test('a style object the zero build drops is a problem', () => {
	assert.equal(
		moduleProblems('m.mts', "const a = { backgroundColor: { default: themed('surface-tint'), hover: themed('surface-hover') } };").length,
		0,
	);
	assert.equal(moduleProblems('m.mts', "const a = { hoverStyle: { backgroundColor: themed('surface-hover') } };").length, 1);
});

test('a transform that starts with none and goes on is a problem', () => {
	assert.equal(transformProblems('f.tsx', '{ transform: { "default": "none", "press": "translateY(1px)" } }').length, 0);
	assert.equal(transformProblems('f.tsx', '{ transform: "translate(1px) translateY(1px)" }').length, 0);
	assert.equal(transformProblems('f.tsx', '{ transform: { "press": "none translateY(1px)" } }').length, 1);
	assert.equal(transformProblems('f.tsx', '{ transform: "none translateY(1px)" }').length, 1);
	assert.equal(transformProblems('f.tsx', '{ transform: "translateY(1px)", borderStyle: "none solid" }').length, 0);
});

test('a target whose end marker comes before the start marker is reported and left unchanged', async () => {
	const directory = mkdtempSync(join(tmpdir(), 'frame-values-markers-'));
	const file = join(directory, 'target.ts');
	const source = `${END}\nconst a = 1;\n${START}\n`;
	writeFileSync(file, source);

	try {
		const problems = await generateFrameValues([{ file, generate: () => 'export const b = 2;' }], false);

		assert.equal(problems.length, 1);
		assert.equal(readFileSync(file, 'utf8'), source);
	} finally {
		rmSync(directory, { recursive: true, force: true });
	}
});
