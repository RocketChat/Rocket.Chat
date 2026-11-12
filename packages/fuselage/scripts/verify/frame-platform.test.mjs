import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
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

test('react-dom is caught however it is imported', () => {
	for (const statement of ["import 'react-dom';", "const dom = require('react-dom');", "const dom = import('react-dom/client');"]) {
		assert.deepEqual(checkFrame(frame(statement)), ['imports react-dom'], statement);
	}
});

test('a frame that names a DOM-only type fails', () => {
	assert.deepEqual(checkFrame(frame('type Props = HTMLAttributes<HTMLDivElement>;')), ['uses the DOM-only type HTMLAttributes']);
});

test('HTMLProps and ComponentProps of a tag name are DOM-only types', () => {
	assert.deepEqual(checkFrame(frame('type Props = HTMLProps<unknown>;')), ['uses the DOM-only type HTMLProps']);
	assert.deepEqual(checkFrame(frame("type Props = ComponentProps<'div'>;")), ["uses the DOM-only type ComponentProps<'"]);
	assert.deepEqual(checkFrame(frame('type Props = ComponentProps<typeof View>;')), []);
});

test('a comment that mentions a DOM type does not count', () => {
	assert.deepEqual(checkFrame(frame('// not an HTMLDivElement')), []);
});

test('a frame is found by its styled() call, whichever module styled comes from', () => {
	const source = "import { styled } from './tamagui';\nimport { createPortal } from 'react-dom';\nexport const Frame = styled(View, {});\n";
	assert.deepEqual(checkFrame(source), ['imports react-dom']);
});

test('a frame declared with type arguments is checked', () => {
	const source = "import { createPortal } from 'react-dom';\nexport const Frame = styled<FrameProps>(View, {});\n";
	assert.deepEqual(checkFrame(source), ['imports react-dom']);
});

test('a module that is not a frame may use DOM imports and types', () => {
	assert.deepEqual(checkFrame("import { createPortal } from 'react-dom';\ntype Props = HTMLAttributes<HTMLDivElement>;\n"), []);
});

test('checkFrames reports each invalid frame in a directory and skips specs', () => {
	const directory = mkdtempSync(join(tmpdir(), 'frame-platform-'));
	try {
		writeFileSync(join(directory, 'Bad.tsx'), frame("import { createPortal } from 'react-dom';"));
		writeFileSync(join(directory, 'Good.tsx'), frame(''));
		writeFileSync(join(directory, 'Bad.spec.tsx'), frame("import { createPortal } from 'react-dom';"));
		assert.deepEqual(checkFrames(directory), [`${join(directory, 'Bad.tsx')}: imports react-dom`]);
	} finally {
		rmSync(directory, { recursive: true, force: true });
	}
});

test('the package passes: no frames declare DOM types', () => {
	assert.deepEqual(checkFrames(join(import.meta.dirname, '../../src')), []);
});
