import { join } from 'node:path';

import { boxDefaults } from './lib/boxDefaults.mts';
import { literal } from './lib/literal.mts';
import type { Target } from './lib/target.mts';
import { percent, radius, themed } from './lib/tokens.mts';

const tones = ['info', 'success', 'warning', 'danger'] as const;

const generate = () => {
	const bar = {
		...boxDefaults,
		display: 'block',
		height: 8,
		borderRadius: radius('large'),
	};

	const track = {
		...bar,
		overflow: 'hidden',
		width: percent(100),
		backgroundColor: themed('surface-neutral'),
	};

	const fills = Object.fromEntries(
		tones.flatMap((tone) => [
			[tone, { backgroundColor: themed(`status-font-on-${tone}`) }],
			[`light-${tone}`, { backgroundColor: themed(`status-background-${tone}`) }],
		]),
	);

	return [
		`const progressBarFrame = ${literal(track)} as const;`,
		`const progressBarFill = ${literal(bar)} as const;`,
		`const progressBarTones = ${literal(fills)} as const;`,
	].join('\n\n');
};

export default [{ file: join(import.meta.dirname, '../../src/components/ProgressBar/ProgressBar.tsx'), generate }] satisfies Target[];
