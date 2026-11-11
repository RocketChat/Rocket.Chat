import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import { findObjectValues } from './zero-css.mjs';

test('a stylesheet with an uncompiled value is reported and a clean one is not', () => {
	const dir = mkdtempSync(join(tmpdir(), 'zero-css-'));
	writeFileSync(join(dir, 'clean.css'), '._bg{background-color:red}');
	assert.deepEqual(findObjectValues(dir), []);
	writeFileSync(join(dir, 'bad.css'), '._bg{background-color:[object Object]}');
	assert.deepEqual(findObjectValues(dir), ['bad.css: 1']);
});
