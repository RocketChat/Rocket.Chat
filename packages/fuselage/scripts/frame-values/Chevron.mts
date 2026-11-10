import { join } from 'node:path';

import { literal } from './lib/literal.mts';
import type { Target } from './lib/target.mts';

const generateChevron = () => {
	const frame = {
		render: 'span',
		display: 'inline-flex',
		flexDirection: 'row',
		alignItems: 'normal',
		flexShrink: 1,
		minWidth: 'auto',
		minHeight: 'auto',
		alignSelf: 'center',
	};

	// --rcx-dir is 1 in left-to-right text and -1 in right-to-left, so the horizontal chevrons turn the other way there
	const directions = {
		up: { transform: 'rotate(-180deg)' },
		down: { transform: 'rotate(0deg)' },
		right: { transform: 'rotate(calc(-90deg * var(--rcx-dir)))' },
		left: { transform: 'rotate(calc(90deg * var(--rcx-dir)))' },
	};

	return [`const chevronFrame = ${literal(frame)} as const;`, `const chevronDirections = ${literal(directions)} as const;`].join('\n\n');
};

const targets: Target[] = [{ file: join(import.meta.dirname, '../../src/components/Chevron/Chevron.tsx'), generate: generateChevron }];

export default targets;
