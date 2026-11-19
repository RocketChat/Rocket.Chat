import { join } from 'node:path';

import { boxDefaults } from './lib/boxDefaults.mts';
import { literal } from './lib/literal.mts';
import type { Target } from './lib/target.mts';
import { textFrameDefaults } from './lib/textFrameDefaults.mts';
import { fontScale, offScale, radius, space, themed } from './lib/tokens.mts';

const statusTones = ['info', 'success', 'warning', 'danger'] as const;

const generate = () => {
	const frame = {
		...boxDefaults,
		display: 'flex',
		padding: space('x12'),
		color: themed('font-default'),
		borderWidth: offScale(1),
		borderStyle: 'solid',
		borderRadius: radius('medium'),
		backgroundColor: themed('surface-light'),
	};

	const tones = {
		default: { borderColor: themed('font-secondary-info') },
		...Object.fromEntries(statusTones.map((tone) => [tone, { borderColor: themed(`status-font-on-${tone}`) }])),
	};

	const body = {
		...boxDefaults,
		flexGrow: 1,
		flexBasis: 0,
		overflow: 'hidden',
		justifyContent: 'space-between',
		marginInlineStart: space('x12'),
	};

	// A callout of 420px or more lays its actions out beside its text instead of below it
	const layouts = {
		stacked: { display: 'block' },
		inline: { display: 'flex', alignItems: 'center' },
	};

	const text = {
		...boxDefaults,
		display: 'flex',
		flexDirection: 'column',
		flexWrap: 'nowrap',
		overflow: 'hidden',
	};

	const title = {
		...boxDefaults,
		...fontScale('p2b'),
		display: 'block',
		whiteSpace: 'nowrap',
		overflow: 'hidden',
		textOverflow: 'ellipsis',
	};
	const content = { ...boxDefaults, ...fontScale('p2'), display: 'block' };
	const actions = { ...boxDefaults, display: 'block' };

	return [
		`const calloutFrame = ${literal(frame)} as const;`,
		`const calloutTones = ${literal(tones)} as const;`,
		`const calloutBody = ${literal(body)} as const;`,
		`const calloutLayouts = ${literal(layouts)} as const;`,
		`const calloutText = ${literal(text)} as const;`,
		`const calloutTitle = ${literal({ ...textFrameDefaults(title), ...title })} as const;`,
		`const calloutContent = ${literal({ ...textFrameDefaults(content), ...content })} as const;`,
		`const calloutContentBelowTitle = ${literal({ marginBlockStart: space('x4') })} as const;`,
		`const calloutActions = ${literal(actions)} as const;`,
		`const calloutActionsBelowText = ${literal({ marginBlockStart: space('x12') })} as const;`,
	].join('\n\n');
};

export default [{ file: join(import.meta.dirname, '../../src/components/Callout/Callout.tsx'), generate }] satisfies Target[];
