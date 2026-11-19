import { join } from 'node:path';

import { literal } from './lib/literal.mts';
import type { Target } from './lib/target.mts';
import { textFrameDefaults } from './lib/textFrameDefaults.mts';
import { fontScale, offScale, radius, size, space, themed } from './lib/tokens.mts';

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
		paddingInline: space('x4'),
		textAlign: 'center',
		whiteSpace: 'nowrap',
		textDecoration: 'none',
		textOverflow: 'ellipsis',
		wordBreak: 'keep-all',
		borderRadius: radius('full'),
		...fontScale('micro'),
	};

	const levels = { primary: 2, secondary: 1, warning: 3, danger: 4 } as const;
	const looks = Object.fromEntries(
		Object.entries(levels).map(([variant, level]) => [
			variant,
			{ color: themed('font-pure-white'), backgroundColor: themed(`badge-background-level-${level}`) },
		]),
	);

	const sizing = {
		regular: { minWidth: size('x16'), minHeight: size('x16') },
		small: { minWidth: size('x8'), minHeight: size('x8') },
	};

	return [
		`const badgeFrame = ${literal({ ...textFrameDefaults(frame), ...frame })} as const;`,
		`const badgeLooks = ${literal(looks)} as const;`,
		`const badgeSizing = ${literal(sizing)} as const;`,
	].join('\n\n');
};

const targets: Target[] = [{ file: join(import.meta.dirname, '../../src/components/Badge/Badge.tsx'), generate: generateBadge }];

export default targets;
