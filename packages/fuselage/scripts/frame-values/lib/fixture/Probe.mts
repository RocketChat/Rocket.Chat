import { join } from 'node:path';

import { literal } from '../literal.mts';
import type { Target } from '../target.mts';
import { fontScale, offScale, radius, rem, size, space, themed, zIndex } from '../tokens.mts';

const generateProbe = () => {
	const frame = {
		render: 'span',
		color: themed('font-default'),
		backgroundColor: { default: themed('surface-tint'), hover: themed('surface-hover'), press: themed('surface-selected') },
		borderColor: themed('stroke-light'),
		borderWidth: offScale(1),
		borderRadius: radius('medium'),
		paddingBlock: offScale(2),
		paddingInline: space('x8'),
		minHeight: 28,
		height: size('x20'),
		width: { default: 20, hover: 24 },
		top: offScale(-1),
		maxWidth: rem(20),
		zIndex: { 'focus-visible': zIndex('raised') },
	};

	const directions = {
		ltr: { transform: 'rotate(-90deg)' },
		rtl: { transform: 'rotate(90deg)' },
	};

	return [
		`const probeFrame = ${literal(frame)} as const;`,
		`const probeDirections = ${literal(directions)} as const;`,
		`const probeText = ${literal({ ...fontScale('p2') })} as const;`,
	].join('\n\n');
};

const targets: Target[] = [{ file: join(import.meta.dirname, 'Probe.tsx'), generate: generateProbe }];

export default targets;
