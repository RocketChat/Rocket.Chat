import { join } from 'node:path';

import { boxDefaults } from './lib/boxDefaults.mts';
import { literal } from './lib/literal.mts';
import type { Target } from './lib/target.mts';
import { offScale, percent, size, themed } from './lib/tokens.mts';

const generate = () => {
	const root = {
		...boxDefaults,
		display: 'flex',
		justifyContent: 'center',
		marginBlock: offScale(-1),
	};

	const circle = {
		...boxDefaults,
		display: 'block',
		marginInline: offScale(1),
		borderRadius: percent(100),
	};

	const sizes = Object.fromEntries(
		(['x4', 'x8', 'x12', 'x16', 'x20', 'x24', 'x32', 'x40'] as const).map((step) => [step, { width: size(step), height: size(step) }]),
	);

	const tones = {
		primary: { backgroundColor: themed('button-background-primary-default') },
		muted: { backgroundColor: themed('button-background-secondary-default') },
		inherit: { backgroundColor: 'currentColor' },
	};

	return [
		`const throbberFrame = ${literal(root)} as const;`,
		`const throbberCircle = ${literal(circle)} as const;`,
		`const throbberSizes = ${literal(sizes)} as const;`,
		`const throbberTones = ${literal(tones)} as const;`,
	].join('\n\n');
};

export default [{ file: join(import.meta.dirname, '../../src/components/Throbber/Throbber.tsx'), generate }] satisfies Target[];
