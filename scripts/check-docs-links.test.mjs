import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import { checkLinks, slug } from './check-docs-links.mjs';

const fixture = (files) => {
	const root = mkdtempSync(join(tmpdir(), 'docs-links-'));
	for (const [path, content] of Object.entries(files)) {
		mkdirSync(join(root, path, '..'), { recursive: true });
		writeFileSync(join(root, path), content);
	}
	return root;
};

test('slug follows GitHub rules', () => {
	assert.equal(slug('The EE tree (`ee/server/`) and the license boundary'), 'the-ee-tree-eeserver-and-the-license-boundary');
	assert.equal(slug('Ação rápida'), 'ação-rápida');
	assert.equal(slug('A — B'), 'a--b');
});

test('accepts valid links in every supported form', () => {
	const root = fixture({
		'Target.md': '# Ação rápida\n## Closed ##\n<a id="custom"></a>\n<a class="x" name="later"></a>\n## Dup\n## Dup\n## [Start](./index.md)\n',
		'my file.md': '# Spaced\n',
		'index.md': [
			'[a](./Target.md#ação-rápida) [b](Target.md#closed) [c](Target.md#custom) [d](Target.md#dup-1)',
			'[e](my%20file.md#spaced) [f](<my file.md>) [g](//example.com) [h](https://x.y) [i](mailto:a@b)',
			'[k](Target.md#later) [l](Target.md#start) <a href="Target.md#custom">m</a> [n](',
			'Target.md#closed)',
			'[ref]: ./Target.md',
			'`[not a link](missing.md)` and ``[nor](missing.md)``',
			'````md',
			'```',
			'[inside fence](missing.md)',
			'```',
			'````',
			'## Local',
			'[j](#local)',
		].join('\n'),
	});
	assert.deepEqual(checkLinks(root, root).errors, []);
});

test('reports broken files, anchors and case mismatches', () => {
	const root = fixture({
		'Target.md': '# Real\n',
		'index.md':
			'[a](missing.md) [b](Target.md#nope) [c](target.md) [d](#gone)\n[ref]: ./also-missing.md\n<a href="html-missing.md">e</a> [f](\nwrapped-missing.md)\n',
	});
	assert.equal(checkLinks(root, root).errors.length, 7);
});
