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
import { themed } from '../tokens.mts';

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

	assert.match(problem, /no token or theme key for \$rcx-typo, \$space\.x5$/);
	assert.equal(readFileSync(frame, 'utf8'), before);
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
		'{border-width:1px}',
		'{min-height:28px}',
		'{width:20px}',
		':where(:hover){width:24px}',
		'{top:-1px}',
		'{max-width:1.25rem}',
		'--t-radius-medium:0.25rem',
		'--t-space-x8:8px',
		':where(:focus-visible){z-index:var(--t-zIndex-raised)}',
		'{transform:rotate(90deg)}',
	]) {
		assert.ok(css.includes(declaration), `the stylesheet has no ${declaration}`);
	}
});
