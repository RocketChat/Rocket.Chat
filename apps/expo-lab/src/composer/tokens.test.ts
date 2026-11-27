import assert from 'node:assert/strict';
import { test } from 'node:test';

import { composerTokens } from './tokens.ts';

test('resolves the names the web composer uses to Fuselage values', () => {
	const t = composerTokens('light');
	assert.equal(t.stroke.light, '#cbced1');
	assert.equal(t.surface.neutral, '#e4e7ea');
	assert.equal(t.font.default, '#2f343d');
	assert.equal(t.radius.medium, 4);
	assert.equal(t.fontScale.p2.fontSize, 14);
	assert.equal(t.fontScale.p2.lineHeight, 20);
	assert.equal(t.fontScale.c1.fontSize, 12);
	assert.equal(t.space.x12, 12);
	assert.equal(t.size.x52, 52);
});

test('follows the theme', () => {
	assert.notEqual(composerTokens('dark').font.default, composerTokens('light').font.default);
	assert.equal(composerTokens('dark').surface.neutral, '#2d3039');
});

test('defaults to light', () => {
	assert.deepEqual(composerTokens().stroke, composerTokens('light').stroke);
});
