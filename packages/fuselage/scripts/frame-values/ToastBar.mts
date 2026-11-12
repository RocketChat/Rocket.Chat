import { join } from 'node:path';

import { elevation } from './lib/elevation.mts';
import { font, textIconColor, themed } from './lib/frameTokens.mts';
import { literal } from './lib/literal.mts';
import { statusPalettes } from './lib/statusPalettes.mts';
import type { Target } from './lib/target.mts';
import { textFrameDefaults } from './lib/textFrameDefaults.mts';
import { surfaceColors } from '../../src/Theme.ts';
import { borderRadius, size, spacing } from '../../src/styleTokens.ts';

const component = (file: string) => join(import.meta.dirname, '../../src/components/ToastBar', file);

const radius = () => borderRadius('medium');
const successColor = () => themed('toastbar-success-color', statusPalettes().success.font);
const errorColor = () => themed('toastbar-error-color', statusPalettes().danger.font);

const generateToastBar = () => {
	const root = {
		render: 'div',
		position: 'relative',
		display: 'block',
		// Stated because the zero build's View defaults (stretch, column, no shrink) would otherwise differ from the runtime build
		alignItems: 'normal',
		flexDirection: 'row',
		flexShrink: 1,
		minWidth: size('x232')!,
		maxWidth: size('x416')!,
		minHeight: 'auto',
		color: themed('toastbar-color', textIconColor('font-default')),
		borderRadius: radius(),
		backgroundColor: themed('toastbar-background-color', surfaceColors['surface-tint'].toString()),
		boxShadow: elevation()['2nb'].boxShadow,
		...font('p2'),
	};

	const inner = {
		render: 'div',
		display: 'flex',
		alignItems: 'normal',
		flexDirection: 'row',
		flexShrink: 1,
		padding: spacing('x16')!,
	};

	const content = {
		render: 'div',
		display: 'block',
		flexShrink: 1,
		minWidth: 'auto',
		width: '100%',
		marginBlock: 0,
		marginInline: spacing('x16')!,
	};

	const progress = {
		render: 'div',
		position: 'absolute',
		display: 'block',
		alignItems: 'normal',
		flexDirection: 'row',
		bottom: 0,
		overflow: 'hidden',
		width: '100%',
		height: size('x4')!,
		borderBottomLeftRadius: radius(),
		borderBottomRightRadius: radius(),
	};

	return [
		`const toastBarFrame = ${literal(root)} as const;`,
		`const toastBarInner = ${literal(inner)} as const;`,
		`const toastBarContent = ${literal({ ...textFrameDefaults(content), ...content })} as const;`,
		`const toastBarProgress = ${literal(progress)} as const;`,
	].join('\n\n');
};

const generateToastBarCss = () => {
	const stripe = size('x4')!;

	return `.rcx-toastbar {
	animation: rcx-toastbar-side-open 0.5s;
}

.rcx-toastbar::before {
	position: absolute;
	top: 0;

	display: block;

	width: 100%;
	height: ${stripe};

	content: '';

	border-radius: ${radius()} ${radius()} 0 0;
	background-color: transparent;
}

.rcx-toastbar--success::before {
	background-color: ${successColor()};
}

.rcx-toastbar--error::before {
	background-color: ${errorColor()};
}

.rcx-toastbar_icon--success {
	color: ${successColor()};
}

.rcx-toastbar_icon--error {
	color: ${errorColor()};
}

.rcx-toastbar_progressbar::after {
	display: block;

	width: 0%;
	height: 100%;

	content: '';

	animation: rcx-toastbar-progress var(--rcx-toastbar-time, 5s) forwards running;

	background-color: ${themed('toastbar-progressbar-background-color', surfaceColors['surface-neutral'].toString())};
}

.rcx-toastbar_progressbar--paused::after {
	animation-play-state: paused;
}

/* Only the ::after reads the duration, and a pseudo-element inherits it from its element */
@property --rcx-toastbar-time {
	inherits: true;
	syntax: '*';
}

@keyframes rcx-toastbar-side-open {
	from {
		opacity: 0;
	}

	to {
		opacity: 1;
	}
}

@keyframes rcx-toastbar-progress {
	from {
		width: 0%;
	}

	to {
		width: 100%;
	}
}`;
};

export default [
	{ file: component('ToastBar.tsx'), generate: generateToastBar },
	{ file: component('ToastBar.styles.css'), generate: generateToastBarCss, css: true },
] satisfies Target[];
