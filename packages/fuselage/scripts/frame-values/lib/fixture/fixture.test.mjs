// The generator end to end: its output for the fixture, compiled by the zero-runtime build the apps use, leaves no
// token for the unresolved-token gate to find.
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import { tamaguiPlugin } from '@tamagui/vite-plugin';
import { build } from 'vite';

import { unresolvedTokens } from '../../../verify/zero-stylesheet.mjs';
import { generateFrameValues, loadModules } from '../generate.mts';
import { size, themed } from '../tokens.mts';

const fuselageRoot = join(import.meta.dirname, '../../../..');
const frame = join(import.meta.dirname, 'Probe.tsx');

// Throws on a frame the compiler cannot lower: a zero build keeps no frame on the runtime.
const zeroStylesheet = async () => {
	const outDir = mkdtempSync(join(tmpdir(), 'frame-values-'));
	try {
		await build({
			root: fuselageRoot,
			configFile: false,
			logLevel: 'error',
			plugins: [
				tamaguiPlugin({
					config: join(fuselageRoot, 'src/tamagui.config.ts'),
					components: [],
					outputCSS: './.tamagui/zero/tamagui-zero.css',
					experimental: { zeroRuntime: true },
				}),
			],
			build: { outDir, emptyOutDir: false, rollupOptions: { input: join(import.meta.dirname, 'index.html'), external: [/^react/] } },
		});
		return readFileSync(join(outDir, 'tamagui-zero.css'), 'utf8');
	} finally {
		rmSync(outDir, { recursive: true, force: true });
	}
};

test('the fixture section is what its module generates', async () => {
	const { problems, targets } = await loadModules(import.meta.dirname);

	assert.deepEqual([...problems, ...(await generateFrameValues(targets, true))], []);
});

test('a theme key or token the config lacks is a problem, and the section is not written', async () => {
	const before = readFileSync(frame, 'utf8');
	const generate = () => `const probeFrame = { color: '${themed('typo')}', padding: '$space.x5', margin: '$space.x8' } as const;`;

	const [problem] = await generateFrameValues([{ file: frame, generate }], false);

	assert.match(problem, /no token, theme key or condition for \$rcx-typo, \$space\.x5$/);
	assert.equal(readFileSync(frame, 'utf8'), before);
});

test('a condition the config lacks is a problem, and the section is not written', async () => {
	const before = readFileSync(frame, 'utf8');
	const generate = () => `const probeFrame = { padding: { default: 2, pointerCoars: 4, '@wide/probe-group': 8 } } as const;`;

	const [problem] = await generateFrameValues([{ file: frame, generate }], false);

	assert.match(problem, /no token, theme key or condition for pointerCoars, @wide\/probe-group$/);
	assert.equal(readFileSync(frame, 'utf8'), before);
});

test('a token in a font property is a problem, and the section is not written', async () => {
	const before = readFileSync(frame, 'utf8');
	const generate = () => `const probeText = { fontSize: '${size('x24')}', lineHeight: '1.25rem' } as const;`;

	for (const check of [true, false]) {
		const [problem, ...rest] = await generateFrameValues([{ file: frame, generate }], check);

		assert.match(problem, /Probe\.tsx:\d+: `fontSize: \$size\.x24` is written out as invalid CSS.*fontScale\(\)/);
		assert.deepEqual(rest, []);
		assert.equal(readFileSync(frame, 'utf8'), before);
	}
});

test('the zero build resolves every reference of the fixture', async () => {
	const css = await zeroStylesheet();

	assert.deepEqual(unresolvedTokens(css), []);
	for (const declaration of [
		'{color:var(--rcx-font-default)}',
		':where(:hover){background-color:var(--rcx-surface-hover)}',
		'{border-radius:var(--t-radius-medium)}',
		'{padding-inline:var(--t-space-x8)}',
		'{padding-block:2px}',
		/@media \(pointer: coarse\) ?\{[^{}]+\{padding-block:var\(--t-space-x4\)\}/,
		/@container probe-group \(max-width: 20rem\) ?\{[^{}]+\{padding-inline:var\(--t-space-x4\)\}/,
		/@media \(hover: none\) ?\{[^{}]+\{opacity:1\}/,
		/@media \(prefers-reduced-motion: reduce\) ?\{[^{}]+\{opacity:0\.75\}/,
		/:where\(\.t_group_probe:hover \*\)\{opacity:1\}/,
		'{border-width:1px}',
		'{min-height:28px}',
		'{width:20px}',
		':where(:hover){width:24px}',
		'{top:-1px}',
		'{max-width:1.25rem}',
		'--t-radius-medium:0.25rem',
		'--t-space-x8:8px',
		'{height:var(--t-size-x20)}',
		'--t-size-x20:1.25rem',
		'{font-size:0.875rem}',
		'{line-height:1.25rem}',
		'{font-weight:400}',
		':where(:focus-visible){z-index:var(--t-zIndex-raised)}',
		'{transform:rotate(90deg)}',
	]) {
		const found = typeof declaration === 'string' ? css.includes(declaration) : declaration.test(css);
		assert.ok(found, `the stylesheet has no ${declaration}`);
	}
});
