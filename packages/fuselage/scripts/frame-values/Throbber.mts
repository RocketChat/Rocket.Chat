import { join } from 'node:path';

import { buttonBackground } from './lib/buttonPalettes.mts';
import { literal } from './lib/literal.mts';
import type { Target } from './lib/target.mts';
import { offScale } from './lib/tokens.mts';
import { size } from '../../src/styleTokens.ts';

const generateThrobber = () => {
	const root = {
		render: 'div',
		display: 'flex',
		flexDirection: 'row',
		flexShrink: 1,
		alignItems: 'normal',
		justifyContent: 'center',
		minWidth: 'auto',
		minHeight: 'auto',
		marginBlock: offScale(-1),
	};

	const circle = {
		render: 'span',
		display: 'block',
		flexDirection: 'row',
		alignItems: 'normal',
		flexShrink: 1,
		minWidth: 'auto',
		minHeight: 'auto',
		marginInline: offScale(1),
		width: `var(--rcx-throbber-size, ${size('x16')})`,
		height: `var(--rcx-throbber-size, ${size('x16')})`,
		borderRadius: '100%',
	};

	const tones = {
		primary: { backgroundColor: buttonBackground('primary', 'default') },
		muted: { backgroundColor: buttonBackground('secondary', 'default') },
		inherit: { backgroundColor: 'currentColor' },
	};

	return [
		`const throbberFrame = ${literal(root)} as const;`,
		`const throbberCircle = ${literal(circle)} as const;`,
		`const throbberTones = ${literal(tones)} as const;`,
	].join('\n\n');
};

const targets: Target[] = [{ file: join(import.meta.dirname, '../../src/components/Throbber/Throbber.tsx'), generate: generateThrobber }];

export default targets;
