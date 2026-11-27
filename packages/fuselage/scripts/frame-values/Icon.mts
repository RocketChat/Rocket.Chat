import { join } from 'node:path';

import { literal } from './lib/literal.mts';
import type { Target } from './lib/target.mts';
import { rem, themed } from './lib/tokens.mts';
import { statusColors, textIconColors } from '../../src/Theme.ts';
import { iconSizes } from '../../src/components/Icon/Icon.contract.ts';
import { tokens } from '../../src/tamagui.tokens.ts';

// Tamagui reads a font size from a font, never from the `size` tokens, so a step states the value of its token.
const sizeOf = (step: string) => {
	if (!Object.hasOwn(tokens.size, step)) {
		throw new Error(`The size scale has no ${step}`);
	}
	return tokens.size[step as keyof typeof tokens.size];
};

const generateIcon = () => {
	const sizes = Object.fromEntries(iconSizes.map((pixels) => [`x${pixels}`, { fontSize: rem(sizeOf(`x${pixels}`)) }]));

	const colors = Object.fromEntries(
		[...Object.keys(textIconColors), ...Object.keys(statusColors)].map((name) => [
			name.replace(/^font-/, ''),
			{ color: themed(name as Parameters<typeof themed>[0]) },
		]),
	);

	return [`const iconSizes = ${literal(sizes)} as const;`, `const iconColors = ${literal(colors)} as const;`].join('\n\n');
};

const targets: Target[] = [{ file: join(import.meta.dirname, '../../src/components/Icon/Icon.web.tsx'), generate: generateIcon }];

export default targets;
