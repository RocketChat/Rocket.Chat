import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import { fontReferenceProblems, moduleProblems, transformProblems } from './check.mts';
import { generateFrameValues } from './generate.mts';
import { literal } from './literal.mts';
import { END, START } from './markers.mts';
import { ch, fontScale, fraction, offScale, percent, radius, rem, size, space, themed, unresolvedReferences, zIndex } from './tokens.mts';

test('literal quotes keys, nests and skips undefined', () => {
	assert.equal(literal({ 'a-b': 1, 'c': { d: 'x', e: undefined } }), '{\n\t"a-b": 1,\n\t"c": {\n\t\t"d": "x",\n\t},\n}');
});

const values = (value, platform) => JSON.parse(literal(value, platform).replace(/,(\s*})/g, '$1'));

test('a plain number is written as it is, on every property and in every state', () => {
	const frame = {
		width: 20,
		minHeight: 28,
		maxWidth: 640,
		top: -1,
		insetInlineStart: 2,
		borderTopLeftRadius: 4,
		fontSize: 14,
		letterSpacing: 1,
		padding: 2,
		marginInline: -1,
		gap: 6,
		borderWidth: 1,
		outlineOffset: 2,
		flexShrink: 1,
		zIndex: 2,
		opacity: 0.5,
		height: { default: 20, hover: 24 },
		sizing: { small: { minWidth: 8, padding: 2 } },
		lineHeightMultiplier: '1',
	};

	assert.deepEqual(values(frame), frame);
	assert.deepEqual(values(frame, 'native'), frame);
});

test('a numeric line height is pixels on the web too, where a bare number would be a multiplier', () => {
	const frame = { lineHeight: 20, sizing: { large: { lineHeight: { default: 28, hover: 0 } } }, flexGrow: 1 };

	assert.deepEqual(values(frame), { lineHeight: '20px', sizing: { large: { lineHeight: { default: '28px', hover: 0 } } }, flexGrow: 1 });
	assert.deepEqual(values(frame, 'native'), frame);
	assert.deepEqual(values({ lineHeight: '1' }), { lineHeight: '1' });
});

test('a rem length is rem on the web, in every state, and the number on native', () => {
	const frame = {
		width: rem(20),
		maxWidth: { default: rem(640), hover: rem(-1) },
		sizing: { small: { top: rem(2), gap: 4 } },
		height: rem(0),
	};

	assert.deepEqual(values(frame), {
		width: '1.25rem',
		maxWidth: { default: '40rem', hover: '-0.0625rem' },
		sizing: { small: { top: '0.125rem', gap: 4 } },
		height: 0,
	});
	assert.deepEqual(values(frame, 'native'), {
		width: 20,
		maxWidth: { default: 640, hover: -1 },
		sizing: { small: { top: 2, gap: 4 } },
		height: 0,
	});
});

test('a color is a theme key, a length or a layer a token of its category', () => {
	assert.equal(themed('font-default'), '$rcx-font-default');
	assert.equal(space('x8'), '$space.x8');
	assert.equal(size('x20'), '$size.x20');
	assert.equal(radius('zero'), '$radius.zero');
	assert.equal(zIndex('overlay'), '$zIndex.overlay');
});

test('every reference the helpers write for a name the config has resolves', () => {
	const body = [themed('button-font-on-secondary-danger-disabled'), space('x40'), size('x64'), radius('full'), zIndex('raised')].join();

	assert.deepEqual(unresolvedReferences(body), []);
});

test('a reference the config lacks is unresolved, whoever wrote it', () => {
	const body = `{ color: '${themed('typo')}', gap: '${space('x5')}', radius: '$radius.none', margin: '$x8', top: '$space.x8', width: '$size.x7', fontSize: '$p2', lineHeight: '$font.p2' }`;

	assert.deepEqual(unresolvedReferences(body), ['$rcx-typo', '$space.x5', '$radius.none', '$x8', '$size.x7', '$p2', '$font.p2']);
});

test('a step of the type scale is its four values, lengths in rem on the web and a weight that is not a length', () => {
	assert.deepEqual(values({ ...fontScale('p2') }), { fontSize: '0.875rem', lineHeight: '1.25rem', fontWeight: '400', letterSpacing: 0 });
	assert.deepEqual(values({ ...fontScale('h1') }), { fontSize: '2rem', lineHeight: '2.5rem', fontWeight: '700', letterSpacing: 0 });
	assert.deepEqual(values({ ...fontScale('c2') }, 'native'), { fontSize: 12, lineHeight: 16, fontWeight: '700', letterSpacing: 0 });
	assert.throws(() => fontScale('p9'), /The type scale has no p9/);
});

test('a font property takes the values of the type scale or a number, never a token', () => {
	const accepted = [
		literal({ ...fontScale('p2'), color: themed('font-default') }),
		literal({ fontSize: 24, lineHeight: rem(32), letterSpacing: 1, fontWeight: '700', width: size('x24') }),
		literal({ sizing: { large: { ...fontScale('h1') } }, height: { default: size('x20'), hover: size('x24') } }),
	];

	for (const body of accepted) {
		assert.deepEqual(fontReferenceProblems('f.tsx', body), []);
	}
});

test('a token in a font property is a problem, in any state and variant, and the message says what to use', () => {
	const rejected = [
		literal({ fontSize: size('x24') }),
		literal({ fontSize: '$p2' }),
		literal({ lineHeight: '$font.p2' }),
		literal({ fontWeight: '$p2b' }),
		literal({ letterSpacing: space('x4') }),
		literal({ fontFamily: '$body' }),
		literal({ fontSize: { default: 14, hover: size('x24') } }),
		literal({ sizing: { large: { lineHeight: size('x24') } } }),
	];

	for (const body of rejected) {
		assert.equal(fontReferenceProblems('f.tsx', body).length, 1, body);
	}
	assert.match(
		fontReferenceProblems('f.tsx', literal({ fontSize: size('x24') }))[0],
		/^f\.tsx:2: .*\$size\.x24.*fontScale\(\).*rem\(24\) for size\('x24'\)/,
	);
	assert.equal(fontReferenceProblems('f.tsx', literal({ fontSize: size('x24'), lineHeight: '$p2' })).length, 2);
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

test('percent, fraction and ch state a share, a grid track and a character width as the string a frame holds', () => {
	assert.equal(percent(100), '100%');
	assert.equal(fraction(1), '1fr');
	assert.equal(ch(4), '4ch');
	assert.equal(
		literal({ width: percent(50), gridTemplateColumns: fraction(1), minWidth: ch(4) }),
		'{\n\t"width": "50%",\n\t"gridTemplateColumns": "1fr",\n\t"minWidth": "4ch",\n}',
	);
});

test('the helpers are the only way to state a percentage, a fraction or a character width in a generator module', () => {
	assert.equal(moduleProblems('m.mts', 'const a = { width: percent(100), gridTemplateColumns: fraction(1), minWidth: ch(4) };').length, 0);
	assert.equal(moduleProblems('m.mts', "const a = { maxHeight: '50vh' };").length, 1);
	assert.equal(moduleProblems('m.mts', "const a = { width: '100%' };").length, 1);
	assert.equal(moduleProblems('m.mts', "const a = { minWidth: '4ch' };").length, 1);
	assert.equal(moduleProblems('m.mts', "const a = { gridTemplateColumns: '1fr' };").length, 1);
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
