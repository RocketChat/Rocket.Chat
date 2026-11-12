import { join } from 'node:path';

import { themed } from './lib/frameTokens.mts';
import { literal } from './lib/literal.mts';
import type { Target } from './lib/target.mts';
import { strokeColors, surfaceColors } from '../../src/Theme.ts';
import { borderRadius } from '../../src/styleTokens.ts';

const generateSkeleton = () => {
	const stroke = strokeColors['stroke-extra-dark'].toString();
	const gradient = `linear-gradient(to right, ${stroke}, color-mix(in srgb, ${stroke}, transparent 50%) 50%, ${stroke})`;
	const radius = (name: 'medium' | 'full') => themed(`border-radius-${name}`, borderRadius(name));

	const frame = {
		render: 'span',
		display: 'block',
		flexDirection: 'row',
		alignItems: 'normal',
		flexGrow: 0,
		flexShrink: 1,
		flexBasis: 'auto',
		minWidth: 'auto',
		minHeight: 'auto',
		boxSizing: 'border-box',
		outlineStyle: 'none',
		fontVariantNumeric: 'tabular-nums',
		width: 'var(--rcx-skeleton-width, auto)',
		height: 'var(--rcx-skeleton-height, 1.2em)',
		opacity: 0.1,
		borderRadius: radius('medium'),
		backgroundImage: gradient,
		backgroundSize: '100vw 100%',
		backgroundRepeat: 'repeat',
	};

	const shapes = {
		text: {
			height: 'var(--rcx-skeleton-height, auto)',
			marginBlock: 0,
			transform: 'scale(1, 0.6)',
			transformOrigin: '0 60%',
		},
		rect: {},
		circle: { borderRadius: radius('full') },
	};

	const inverted = { true: { backgroundColor: surfaceColors['surface-light'].toString() }, false: {} };

	return [
		`const skeletonFrame = ${literal(frame)} as const;`,
		`const skeletonShapes = ${literal(shapes)} as const;`,
		`const skeletonInverted = ${literal(inverted)} as const;`,
	].join('\n\n');
};

export default [
	{ file: join(import.meta.dirname, '../../src/components/Skeleton/Skeleton.tsx'), generate: generateSkeleton },
] satisfies Target[];
