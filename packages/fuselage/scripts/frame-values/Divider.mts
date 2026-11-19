import { join } from 'node:path';

import { boxDefaults } from './lib/boxDefaults.mts';
import { literal } from './lib/literal.mts';
import type { Target } from './lib/target.mts';
import { textFrameDefaults } from './lib/textFrameDefaults.mts';
import { offScale, size, space, themed } from './lib/tokens.mts';

const generate = () => {
	const rule = {
		...boxDefaults,
		display: 'block',
		borderTopWidth: offScale(1),
		borderTopStyle: 'solid',
	};

	// One table for orientation and tone: two variants cannot both contribute a border. A tone paints every side, the
	// default only the sides that have a width.
	const resting = themed('stroke-extra-light');
	const vertical = { width: 0, borderLeftWidth: offScale(1), borderLeftStyle: 'solid' };
	const tones = { danger: themed('stroke-error'), light: themed('stroke-light'), medium: themed('stroke-medium') };
	const looks = {
		default: { borderTopColor: resting },
		vertical: { ...vertical, borderTopColor: resting, borderLeftColor: resting },
		...Object.fromEntries(
			Object.entries(tones).flatMap(([tone, borderColor]) => [
				[tone, { borderColor }],
				[`vertical-${tone}`, { ...vertical, borderColor }],
			]),
		),
	};

	const spacings = {
		'rule': { marginBlock: space('x8') },
		'vertical': { marginBlock: 0, marginInline: space('x8') },
		'vertical-small': { marginBlock: 0, marginInline: space('x4') },
		'flush': { margin: 0 },
	};

	const stretches = {
		fixed: { height: size('x20') },
		fill: { alignSelf: 'stretch', height: 'auto' },
	};

	const labelled = {
		...boxDefaults,
		display: 'flex',
		alignItems: 'center',
		paddingInline: 0,
	};

	const bar = {
		...boxDefaults,
		display: 'flex',
		justifyContent: 'flex-end',
		alignItems: 'center',
		flexGrow: 1,
	};

	const label = {
		...boxDefaults,
		display: 'block',
		marginBlock: space('x8'),
		paddingInline: space('x8'),
	};

	return [
		`const dividerRule = ${literal(rule)} as const;`,
		`const dividerLooks = ${literal(looks)} as const;`,
		`const dividerSpacings = ${literal(spacings)} as const;`,
		`const dividerStretches = ${literal(stretches)} as const;`,
		`const dividerLabelled = ${literal(labelled)} as const;`,
		`const dividerBar = ${literal(bar)} as const;`,
		`const dividerLabel = ${literal({ ...textFrameDefaults(label), ...label })} as const;`,
	].join('\n\n');
};

export default [{ file: join(import.meta.dirname, '../../src/components/Divider/Divider.tsx'), generate }] satisfies Target[];
