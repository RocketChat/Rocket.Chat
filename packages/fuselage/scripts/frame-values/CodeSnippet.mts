import { join } from 'node:path';

import { textIconColor, themed } from './lib/frameTokens.mts';
import { literal } from './lib/literal.mts';
import type { Target } from './lib/target.mts';
import { textFrameDefaults } from './lib/textFrameDefaults.mts';
import { surfaceColors } from '../../src/Theme.ts';
import { borderRadius, size, spacing } from '../../src/styleTokens.ts';

const generateCodeSnippet = () => {
	const root = {
		render: 'pre',
		display: 'flex',
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		flexShrink: 1,
		minWidth: 'auto',
		width: '100%',
		minHeight: size('x60')!,
		padding: spacing('x16')!,
		color: textIconColor('font-default'),
		borderRadius: themed('code-snippet-border-radius', themed('border-radius-medium', borderRadius('medium'))),
		backgroundColor: surfaceColors['surface-neutral'].toString(),
	};

	const codeBox = {
		render: 'div',
		display: 'block',
		flexDirection: 'row',
		alignItems: 'normal',
		flexShrink: 1,
		minWidth: 'auto',
		minHeight: 'auto',
		marginRight: spacing('x8')!,
		whiteSpace: 'pre-line',
		wordBreak: 'break-all',
		fontFamily: 'monospace',
	};

	const action = {
		render: 'div',
		display: 'block',
		flexDirection: 'row',
		alignItems: 'normal',
		flexShrink: 1,
		minWidth: 'auto',
		minHeight: 'auto',
	};

	return [
		`const codeSnippetFrame = ${literal(root)} as const;`,
		`const codeSnippetCodeBox = ${literal({ ...textFrameDefaults(codeBox), ...codeBox })} as const;`,
		`const codeSnippetAction = ${literal(action)} as const;`,
	].join('\n\n');
};

export default [
	{ file: join(import.meta.dirname, '../../src/components/CodeSnippet/CodeSnippet.tsx'), generate: generateCodeSnippet },
] satisfies Target[];
