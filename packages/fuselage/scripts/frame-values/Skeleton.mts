import { join } from 'node:path';

import { boxDefaults } from './lib/boxDefaults.mts';
import { literal } from './lib/literal.mts';
import type { Target } from './lib/target.mts';
import { radius, themed } from './lib/tokens.mts';

const generate = () => {
	const shade = themed('stroke-extra-dark');

	const frame = {
		...boxDefaults,
		display: 'block',
		outlineStyle: 'none',
		fontVariantNumeric: 'tabular-nums',
		opacity: 0.1,
		borderRadius: radius('medium'),
		backgroundImage: `linear-gradient(to right, ${shade}, color-mix(in srgb, ${shade}, transparent 50%) 50%, ${shade})`,
		backgroundSize: '100vw 100%',
		backgroundRepeat: 'repeat',
	};

	const shapes = {
		text: { marginBlock: 0, transform: 'scale(1, 0.6)', transformOrigin: '0 60%' },
		rect: {},
		circle: { borderRadius: radius('full') },
	};

	const inverted = {
		true: { backgroundColor: themed('surface-light') },
		false: {},
	};

	return [
		`const skeletonFrame = ${literal(frame)} as const;`,
		`const skeletonShapes = ${literal(shapes)} as const;`,
		`const skeletonInverted = ${literal(inverted)} as const;`,
	].join('\n\n');
};

export default [{ file: join(import.meta.dirname, '../../src/components/Skeleton/Skeleton.tsx'), generate }] satisfies Target[];
