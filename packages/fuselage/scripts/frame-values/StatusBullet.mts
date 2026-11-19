import { join } from 'node:path';

import { boxDefaults } from './lib/boxDefaults.mts';
import { literal } from './lib/literal.mts';
import type { Target } from './lib/target.mts';
import { radius, rem, size, themed } from './lib/tokens.mts';

const generate = () => {
	const frame = {
		...boxDefaults,
		display: 'inline-block',
		flexShrink: 0,
		borderRadius: radius('full'),
		backgroundSize: 'contain',
	};

	const sizes = {
		regular: { width: size('x12'), height: size('x12') },
		small: { width: rem(10), height: rem(10) },
	};

	// A ring is drawn by its stroke, the other bullets by their fill
	const statuses = {
		online: { fill: themed('status-bullet-online') },
		away: { fill: themed('status-bullet-away') },
		busy: { fill: themed('status-bullet-busy') },
		disabled: { fill: themed('status-bullet-disabled') },
		offline: { stroke: themed('status-bullet-offline') },
		loading: { stroke: themed('status-bullet-loading') },
	};

	return [
		`const statusBulletFrame = ${literal(frame)} as const;`,
		`const statusBulletSizes = ${literal(sizes)} as const;`,
		`const statusBulletStatuses = ${literal(statuses)} as const;`,
	].join('\n\n');
};

export default [{ file: join(import.meta.dirname, '../../src/components/StatusBullet/StatusBullet.tsx'), generate }] satisfies Target[];
