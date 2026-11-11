import { join } from 'node:path';

import { themed } from './lib/frameTokens.mts';
import { literal } from './lib/literal.mts';
import type { Target } from './lib/target.mts';
import { offScale } from './lib/tokens.mts';
import { surfaceColors } from '../../src/Theme.ts';
import { borderRadius, borderWidth, size } from '../../src/styleTokens.ts';

const sizes = [16, 18, 20, 24, 28, 32, 36, 40, 48, 124, 200, 332] as const;
const objectFits = ['contain', 'cover', 'fill', 'none', 'scale-down'] as const;

const radiusOf = (pixels: (typeof sizes)[number]) => {
	if (pixels <= 18) return 'small';
	return pixels === 332 ? 'large' : 'medium';
};

const component = (file: string) => join(import.meta.dirname, '../../src/components/Avatar', file);

const generateContainer = () => {
	const sizing = Object.fromEntries(sizes.map((pixels) => [`x${pixels}`, { width: size(`x${pixels}`)!, height: size(`x${pixels}`)! }]));

	const container = {
		render: 'figure',
		display: 'inline-flex',
		flexDirection: 'row',
		alignItems: 'normal',
		flexShrink: 1,
		minWidth: 'auto',
		minHeight: 'auto',
		verticalAlign: 'middle',
	};

	// Overlaps its neighbour in a stack, as a design value of the avatar's own frame
	const stacked = { true: { marginBlock: 'auto', marginInline: offScale(-2) }, false: {} };

	const interactive = { true: { cursor: 'pointer' }, false: {} };

	return [
		`const avatarContainerInteractive = ${literal(interactive)} as const;`,
		`const avatarContainerFrame = ${literal(container)} as const;`,
		`const avatarContainerSizing = ${literal(sizing)} as const;`,
		`const avatarContainerStacked = ${literal(stacked)} as const;`,
	].join('\n\n');
};

const generateImage = () => {
	const image = {
		render: 'img',
		display: 'block',
		flexDirection: 'row',
		alignItems: 'normal',
		flexShrink: 1,
		minWidth: 'auto',
		minHeight: 'auto',
		position: 'relative',
		width: '100%',
		height: '100%',
	};

	// The radius follows the size, and `rounded` replaces it, so one variant holds both
	const shape = {
		...Object.fromEntries(
			sizes.map((pixels) => [
				`x${pixels}`,
				{
					borderRadius: themed(
						`avatar-border-radius-${pixels}`,
						themed(`border-radius-${radiusOf(pixels)}`, borderRadius(radiusOf(pixels))),
					),
				},
			]),
		),
		rounded: { borderRadius: themed('avatar-border-radius-rounded', themed('border-radius-full', borderRadius('full'))) },
	};

	const objectFit = Object.fromEntries(objectFits.map((value) => [value, { objectFit: value }]));

	// A stacked avatar keeps a ring of the stack's background between it and the next one
	const ring = { true: { borderWidth: borderWidth('default'), borderStyle: 'solid', borderColor: 'transparent' }, false: {} };

	const interactive = { true: { cursor: 'pointer' }, false: {} };

	return [
		`const avatarImageInteractive = ${literal(interactive)} as const;`,
		`const avatarImageFrame = ${literal(image)} as const;`,
		`const avatarImageShape = ${literal(shape)} as const;`,
		`const avatarImageObjectFit = ${literal(objectFit)} as const;`,
		`const avatarImageRing = ${literal(ring)} as const;`,
	].join('\n\n');
};

const generateStack = () => {
	const stack = {
		render: 'div',
		display: 'flex',
		flexDirection: 'row-reverse',
		alignItems: 'normal',
		justifyContent: 'center',
		flexShrink: 1,
		minWidth: 'auto',
		minHeight: 'auto',
		backgroundColor: themed('avatar-background-color', surfaceColors['surface-light'].toString()),
	};

	return `const avatarStackFrame = ${literal(stack)} as const;`;
};

export default [
	{ file: component('AvatarContainer.tsx'), generate: generateContainer },
	{ file: component('Avatar.tsx'), generate: generateImage },
	{ file: component('AvatarStack.tsx'), generate: generateStack },
] satisfies Target[];
