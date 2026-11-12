import { join } from 'node:path';

import { font, textIconColor, themed } from './lib/frameTokens.mts';
import { literal } from './lib/literal.mts';
import type { Target } from './lib/target.mts';
import { textFrameDefaults } from './lib/textFrameDefaults.mts';
import { offScale } from './lib/tokens.mts';
import { badgeBackgroundColors } from '../../src/Theme.ts';
import { borderRadius, size, spacing } from '../../src/styleTokens.ts';

const generateBadge = () => {
	const frame = {
		render: 'span',
		display: 'flex',
		flexDirection: 'row',
		flexShrink: 1,
		alignItems: 'normal',
		justifyContent: 'center',
		overflow: 'hidden',
		width: 'fit-content',
		paddingBlock: offScale(2),
		paddingInline: spacing('x4'),
		textAlign: 'center',
		whiteSpace: 'nowrap',
		textDecoration: 'none',
		textOverflow: 'ellipsis',
		wordBreak: 'keep-all',
		borderRadius: themed('badge-border-radius', themed('border-radius-full', borderRadius('full'))),
		...font('micro'),
	};

	const levels = { primary: 2, secondary: 1, warning: 3, danger: 4 } as const;
	const looks = Object.fromEntries(
		Object.entries(levels).map(([variant, level]) => [
			variant,
			{
				color: themed(`badge-colors-${variant}-color`, textIconColor('font-pure-white')),
				backgroundColor: themed(
					`badge-colors-${variant}-background-color`,
					badgeBackgroundColors[`badge-background-level-${level}` as keyof typeof badgeBackgroundColors].toString(),
				),
			},
		]),
	);

	const sizing = {
		regular: { minWidth: size('x16')!, minHeight: size('x16')! },
		small: { minWidth: size('x8')!, minHeight: size('x8')! },
	};

	return [
		`const badgeFrame = ${literal({ ...textFrameDefaults(frame), ...frame })} as const;`,
		`const badgeLooks = ${literal(looks)} as const;`,
		`const badgeSizing = ${literal(sizing)} as const;`,
	].join('\n\n');
};

const targets: Target[] = [{ file: join(import.meta.dirname, '../../src/components/Badge/Badge.tsx'), generate: generateBadge }];

export default targets;
