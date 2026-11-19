import { join } from 'node:path';

import { boxDefaults } from './lib/boxDefaults.mts';
import { literal } from './lib/literal.mts';
import type { Target } from './lib/target.mts';
import { textFrameDefaults } from './lib/textFrameDefaults.mts';
import { percent, radius, size, space, themed } from './lib/tokens.mts';

const generate = () => {
	const frame = {
		...boxDefaults,
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		width: percent(100),
		minHeight: size('x60'),
		padding: space('x16'),
		color: themed('font-default'),
		borderRadius: radius('medium'),
		backgroundColor: themed('surface-neutral'),
	};

	const codeBox = {
		...boxDefaults,
		display: 'block',
		marginInlineEnd: space('x8'),
		whiteSpace: 'pre-line',
		wordBreak: 'break-all',
	};

	const action = { ...boxDefaults, display: 'block' };

	return [
		`const codeSnippetFrame = ${literal(frame)} as const;`,
		`const codeSnippetCodeBox = ${literal({ ...textFrameDefaults(codeBox), ...codeBox })} as const;`,
		`const codeSnippetAction = ${literal(action)} as const;`,
	].join('\n\n');
};

export default [{ file: join(import.meta.dirname, '../../src/components/CodeSnippet/CodeSnippet.tsx'), generate }] satisfies Target[];
