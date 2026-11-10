import assert from 'node:assert/strict';
import { join } from 'node:path';
import { test } from 'node:test';

import { checkFrame, checkFrames } from './frame-platform.mjs';

const frame = (body) => `import { styled, View } from '@tamagui/web';\n${body}\nexport const Frame = styled(View, { name: 'Frame' });\n`;

test('a frame without DOM imports or types passes', () => {
	assert.deepEqual(checkFrame(frame("import type { ViewProps } from '@tamagui/web';")), []);
});

test('a frame that imports react-dom fails', () => {
	assert.deepEqual(checkFrame(frame("import { createPortal } from 'react-dom';")), ['imports react-dom']);
});

test('a frame that names a DOM-only type fails', () => {
	assert.deepEqual(checkFrame(frame('type Props = HTMLAttributes<HTMLDivElement>;')), ['uses the DOM-only type HTMLAttributes']);
});

test('a comment that mentions a DOM type does not count', () => {
	assert.deepEqual(checkFrame(frame('// not an HTMLDivElement')), []);
});

test('a module that is not a Tamagui frame may use DOM types', () => {
	assert.deepEqual(checkFrame("import { createPortal } from 'react-dom';\nconst x = styled(Box);"), []);
});

test('the package passes: no frames declare DOM types', () => {
	assert.deepEqual(checkFrames(join(import.meta.dirname, '../../src')), []);
});
