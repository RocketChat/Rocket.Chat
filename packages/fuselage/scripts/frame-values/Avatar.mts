import { join } from 'node:path';

import { boxDefaults } from './lib/boxDefaults.mts';
import { literal } from './lib/literal.mts';
import type { Platform } from './lib/literal.mts';
import type { Target } from './lib/target.mts';
import { offScale, percent, radius, rem, size, themed } from './lib/tokens.mts';

const onScale = [16, 18, 20, 24, 28, 32, 36, 40, 48] as const;
const offScaleSizes = [124, 200, 332] as const;
const objectFits = ['contain', 'cover', 'fill', 'none', 'scale-down'] as const;

const component = (file: string) => join(import.meta.dirname, '../../src/components/Avatar', file);

// A part that takes a press shows it
const interactive = { true: { cursor: 'pointer' }, false: {} };

const generateContainer = () => {
	const frame = {
		...boxDefaults,
		display: 'inline-flex',
		verticalAlign: 'middle',
	};

	const sizing = {
		...Object.fromEntries(onScale.map((pixels) => [`x${pixels}`, { width: size(`x${pixels}`), height: size(`x${pixels}`) }])),
		...Object.fromEntries(offScaleSizes.map((pixels) => [`x${pixels}`, { width: rem(pixels), height: rem(pixels) }])),
	};

	// An avatar in a stack overlaps its neighbours
	const stacked = { true: { marginBlock: 'auto', marginInline: offScale(-2) }, false: {} };

	return [
		`const avatarContainerFrame = ${literal(frame)} as const;`,
		`const avatarContainerSizing = ${literal(sizing)} as const;`,
		`const avatarContainerStacked = ${literal(stacked)} as const;`,
		`const avatarContainerInteractive = ${literal(interactive)} as const;`,
	].join('\n\n');
};

const imageValues = (platform: Platform) => {
	const frame = {
		...boxDefaults,
		...(platform === 'web' ? { display: 'block' } : {}),
		position: 'relative',
		width: percent(100),
		height: percent(100),
	};

	// The radius follows the size, and `rounded` replaces it
	const shape = {
		small: { borderRadius: radius('small') },
		medium: { borderRadius: radius('medium') },
		large: { borderRadius: radius('large') },
		rounded: { borderRadius: radius('full') },
	};

	const objectFit = Object.fromEntries(objectFits.map((value) => [value, { objectFit: value }]));

	// An avatar in a stack keeps a ring of the stack's background between it and its neighbour
	const ring = { true: { borderWidth: offScale(1), borderStyle: 'solid', borderColor: 'transparent' }, false: {} };

	return [
		`const avatarImageFrame = ${literal(frame, platform)} as const;`,
		`const avatarImageShape = ${literal(shape, platform)} as const;`,
		`const avatarImageObjectFit = ${literal(objectFit, platform)} as const;`,
		`const avatarImageRing = ${literal(ring, platform)} as const;`,
		`const avatarImageInteractive = ${literal(interactive, platform)} as const;`,
	].join('\n\n');
};

const generateStack = () => {
	const frame = {
		...boxDefaults,
		display: 'flex',
		flexDirection: 'row-reverse',
		justifyContent: 'center',
		backgroundColor: themed('surface-light'),
	};

	return `const avatarStackFrame = ${literal(frame)} as const;`;
};

export default [
	{ file: component('AvatarContainer.tsx'), generate: generateContainer },
	{ file: component('AvatarImage.tsx'), generate: () => imageValues('web') },
	{ file: component('AvatarImage.native.tsx'), generate: () => imageValues('native') },
	{ file: component('AvatarStack.tsx'), generate: generateStack },
] satisfies Target[];
