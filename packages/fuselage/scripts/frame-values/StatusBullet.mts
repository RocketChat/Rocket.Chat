import { createRequire } from 'node:module';
import { join } from 'node:path';

import { literal } from './lib/literal.mts';
import type { Target } from './lib/target.mts';
import { toCSSColorValue } from '../../src/helpers/toCSSValue.ts';
import { borderRadius, size } from '../../src/styleTokens.ts';

const require = createRequire(import.meta.url);
const statusBulletColors: { light: Record<string, string> } = require('@rocket.chat/fuselage-tokens/dist/statusBullet.json');

const generateStatusBullet = () => {
	// The bullet is plain DOM on develop: an svg that a View's own defaults would otherwise change
	const frame = {
		render: 'svg',
		display: 'inline-block',
		flexDirection: 'row',
		alignItems: 'normal',
		flexGrow: 0,
		flexShrink: 0,
		flexBasis: 'auto',
		minWidth: 'auto',
		minHeight: 'auto',
		borderRadius: borderRadius('full'),
		backgroundSize: 'contain',
	};

	const sizes = {
		regular: { width: size('x12')!, height: size('x12')! },
		small: { width: size('x10')!, height: size('x10')! },
	};

	const paint = (name: string, property: 'fill' | 'stroke') => ({
		[property]: toCSSColorValue(`status-bullet-${name}`, statusBulletColors.light[name]),
	});

	const statuses = {
		online: paint('online', 'fill'),
		away: paint('away', 'fill'),
		busy: paint('busy', 'fill'),
		disabled: paint('disabled', 'fill'),
		offline: paint('offline', 'stroke'),
		loading: paint('loading', 'stroke'),
	};

	return [
		`const statusBulletFrame = ${literal(frame)} as const;`,
		`const statusBulletSizes = ${literal(sizes)} as const;`,
		`const statusBulletStatuses = ${literal(statuses)} as const;`,
	].join('\n\n');
};

const targets: Target[] = [
	{ file: join(import.meta.dirname, '../../src/components/StatusBullet/StatusBullet.tsx'), generate: generateStatusBullet },
];

export default targets;
