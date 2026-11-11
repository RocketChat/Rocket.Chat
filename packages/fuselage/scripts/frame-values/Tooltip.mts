import { join } from 'node:path';

import { font, textIconColor, themed } from './lib/frameTokens.mts';
import { literal } from './lib/literal.mts';
import type { Target } from './lib/target.mts';
import { textFrameDefaults } from './lib/textFrameDefaults.mts';
import { offScale } from './lib/tokens.mts';
import { surfaceColors } from '../../src/Theme.ts';
import { borderRadius, spacing } from '../../src/styleTokens.ts';

const component = (file: string) => join(import.meta.dirname, '../../src/components/Tooltip', file);

const darkBackground = () => themed('tooltip-dark-background-color', surfaceColors['surface-dark'].toString());

const generateTooltip = () => {
	const frame = {
		render: 'div',
		position: 'relative',
		display: 'inline-block',
		flexShrink: 1,
		maxWidth: offScale(240),
		paddingBlock: spacing('x8')!,
		paddingInline: spacing('x12')!,
		userSelect: 'none',
		wordBreak: 'break-word',
		pointerEvents: 'none',
		borderRadius: themed('tooltip-border-radius', themed('border-radius-medium', borderRadius('medium'))),
		...font('p2m'),
	};

	const looks = {
		dark: {
			color: themed('tooltip-dark-text-color', textIconColor('font-white')),
			backgroundColor: darkBackground(),
		},
		light: {
			color: themed('tooltip-light-text-color', textIconColor('font-default')),
			backgroundColor: themed('tooltip-light-background-color', surfaceColors['surface-neutral'].toString()),
		},
	};

	return [
		`const tooltipFrame = ${literal({ ...textFrameDefaults(frame), ...frame })} as const;`,
		`const tooltipLooks = ${literal(looks)} as const;`,
	].join('\n\n');
};

const generateArrow = () => {
	const arrow = spacing('x4')!;
	const toward = spacing('-x4')!;
	const inset = spacing('x8')!;

	return `.rcx-tooltip--dir-top::after,
.rcx-tooltip--dir-bottom::after,
.rcx-tooltip--dir-left::after,
.rcx-tooltip--dir-right::after {
	position: absolute;

	box-sizing: border-box;

	content: ' ';

	border-width: ${arrow};
	border-color: transparent transparent ${darkBackground()} ${darkBackground()};
	border-radius: 0 0 0 ${offScale(2)};
	block-size: 0;
	inline-size: 0;
}

.rcx-tooltip--dir-top::after {
	inset-block-end: ${toward};

	transform: rotate(-45deg);
}

.rcx-tooltip--dir-bottom::after {
	inset-block-start: ${toward};

	transform: rotate(135deg);
}

.rcx-tooltip--dir-left::after {
	inset-block-start: 50%;
	right: ${toward};

	margin-block-start: ${toward};

	transform: rotate(-135deg);
}

.rcx-tooltip--dir-right::after {
	inset-block-start: 50%;
	left: ${toward};

	margin-block-start: ${toward};

	transform: rotate(45deg);
}

.rcx-tooltip--pos-middle::after {
	left: 50%;

	margin-left: ${toward};
}

.rcx-tooltip--pos-start::after {
	left: ${inset};

	margin: 0;
}

.rcx-tooltip--pos-end::after {
	left: initial;
	right: ${inset};

	margin: 0;
}`;
};

export default [
	{ file: component('Tooltip.tsx'), generate: generateTooltip },
	{ file: component('Tooltip.styles.css'), generate: generateArrow, css: true },
] satisfies Target[];
