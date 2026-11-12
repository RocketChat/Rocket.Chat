import { join } from 'node:path';

import { themed } from './lib/frameTokens.mts';
import { literal } from './lib/literal.mts';
import { statusPalettes, statusTones } from './lib/statusPalettes.mts';
import type { Target } from './lib/target.mts';
import { surfaceColors } from '../../src/Theme.ts';
import { borderRadius, spacing } from '../../src/styleTokens.ts';

const component = (file: string) => join(import.meta.dirname, '../../src/components/ProgressBar', file);

const radius = () => themed('progress-bar-border-radius', borderRadius('large'));

const generateProgressBar = () => {
	const root = {
		render: 'div',
		display: 'block',
		flexDirection: 'row',
		alignItems: 'normal',
		flexShrink: 1,
		minWidth: 'auto',
		minHeight: 'auto',
		overflow: 'hidden',
		width: '100%',
		height: spacing('x8'),
		borderRadius: radius(),
		backgroundColor: themed('progress-bar-color-background', surfaceColors['surface-neutral'].toString()),
	};

	const fill = {
		render: 'div',
		display: 'block',
		flexDirection: 'row',
		alignItems: 'normal',
		flexShrink: 1,
		minWidth: 'auto',
		minHeight: 'auto',
		width: 'var(--rcx-progress-bar-percentage, 0%)',
		height: spacing('x8'),
		borderRadius: radius(),
	};

	const palettes = statusPalettes();
	const tones = Object.fromEntries(
		statusTones.flatMap((tone) => [
			[tone, { backgroundColor: palettes[tone].font }],
			[`light-${tone}`, { backgroundColor: palettes[tone].background }],
		]),
	);

	return [
		`const progressBarFrame = ${literal(root)} as const;`,
		`const progressBarFill = ${literal(fill)} as const;`,
		`const progressBarTones = ${literal(tones)} as const;`,
	].join('\n\n');
};

const generateProgressBarCss = () => `.rcx-progress-bar__fill--animated::before {
	position: absolute;
	inset: 0;

	width: inherit;

	content: '';
	animation: rcx-progress-bar__animation 2s ease-out infinite;

	opacity: 0;
	border-radius: ${radius()};
	background: ${themed('progress-bar-color-shine', surfaceColors['surface-light'].toString())};
}`;

const targets: Target[] = [
	{ file: component('ProgressBar.tsx'), generate: generateProgressBar },
	{ file: component('ProgressBar.styles.css'), generate: generateProgressBarCss, css: true },
];

export default targets;
