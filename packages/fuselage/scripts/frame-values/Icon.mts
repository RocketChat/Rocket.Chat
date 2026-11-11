import { join } from 'node:path';

import { literal } from './lib/literal.mts';
import type { Target } from './lib/target.mts';
import { textFrameDefaults } from './lib/textFrameDefaults.mts';
import { statusColors, textIconColors } from '../../src/Theme.ts';

const generateIcon = () => {
	const frame = {
		render: 'i',
		display: 'inline-block',
		flexDirection: 'row',
		alignItems: 'normal',
		minWidth: 'auto',
		minHeight: 'auto',
		flexShrink: 0,
		userSelect: 'none',
		verticalAlign: 'text-bottom',
		letterSpacing: 0,
		fontFamily: 'RocketChat',
		fontSize: 'var(--rcx-icon-size, inherit)',
		fontWeight: 400,
		fontStyle: 'normal',
		fontVariant: 'normal',
		lineHeight: '1',
		textRendering: 'auto',
	};

	// The names are the closed `IconColor` set: a font token without its `font-` prefix, or a status font token
	const tones = Object.fromEntries([
		...Object.entries(textIconColors).map(([name, value]) => [name.replace(/^font-/, ''), { color: value.toString() }]),
		...Object.entries(statusColors).map(([name, value]) => [name, { color: value.toString() }]),
	]);

	return [
		`const iconFrame = ${literal({ ...textFrameDefaults(frame), ...frame })} as const;`,
		`const iconTones = ${literal(tones)} as const;`,
	].join('\n\n');
};

const targets: Target[] = [{ file: join(import.meta.dirname, '../../src/components/Icon/Icon.tsx'), generate: generateIcon }];

export default targets;
