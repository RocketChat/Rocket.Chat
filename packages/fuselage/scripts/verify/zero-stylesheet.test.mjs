import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { pathToFileURL } from 'node:url';

import { undeclaredThemeKeys, unresolvedTokens } from './zero-stylesheet.mjs';

test('the check runs where no package is installed, as in the production install a build runs under', async () => {
	const root = mkdtempSync(join(tmpdir(), 'zero-stylesheet-'));
	try {
		for (const file of ['scripts/verify/zero-stylesheet.mjs', 'src/tamagui.tokens.ts']) {
			cpSync(join(import.meta.dirname, '../..', file), join(root, file));
		}
		const { zeroStylesheetErrors } = await import(pathToFileURL(join(root, 'scripts/verify/zero-stylesheet.mjs')).href);

		assert.match((await zeroStylesheetErrors('.a{color:$typo}'))[0], /\$typo$/);
	} finally {
		rmSync(root, { recursive: true });
	}
});

test('a stylesheet whose tokens all resolved has none', () => {
	assert.deepEqual(
		unresolvedTokens(':root .t_light{--rcx-font-default:var(--t3)}._col-rcx-font-default{color:var(--rcx-font-default)}'),
		[],
	);
});

test('a token or theme key the config does not have is left as written', () => {
	const css = '._col-doesNotExist{color:$doesNotExist}._bg-rcx-typo{background-color:$rcx-typo}._p-space{padding:$space.x5}';

	assert.deepEqual(unresolvedTokens(css), ['$doesNotExist', '$rcx-typo', '$space.x5']);
});

test('each one is reported once', () => {
	assert.deepEqual(unresolvedTokens('.a{color:$typo}.b:hover{color:$typo}'), ['$typo']);
});

test('an ends-with attribute selector is not a token', () => {
	assert.deepEqual(unresolvedTokens('[class$="-icon"]{display:none}a[href$=".pdf"]{color:red}'), []);
});
test('a theme key declared under its own name in every theme is not reported', () => {
	const css =
		':root .t_light, :root .t_dark .t_light{--rcx-a:var(--t0);--rcx-b:var(--t1);}:root .t_dark,:root .t_light .t_dark{--rcx-a:var(--t2);--rcx-b:var(--t3)}';

	assert.deepEqual(undeclaredThemeKeys(css, { light: { 'rcx-a': '', 'rcx-b': '' }, dark: { 'rcx-a': '', 'rcx-b': '' } }), []);
});

test('a theme key declared under a shortened name, or in another theme only, is reported', () => {
	const css = ':root .t_light{--rcx-a:var(--t0);--rcx-long-de97204770:var(--t1)}:root .t_dark{--rcx-long-default:var(--t1)}';
	const keys = { 'rcx-a': '', 'rcx-long-default': '' };

	assert.deepEqual(undeclaredThemeKeys(css, { light: keys, dark: keys }), ['light: rcx-long-default', 'dark: rcx-a']);
});

test('a variable a declaration reads is not one it declares', () => {
	assert.deepEqual(undeclaredThemeKeys(':root .t_light{--rcx-b:var(--rcx-a)}', { light: { 'rcx-a': '' } }), ['light: rcx-a']);
});
