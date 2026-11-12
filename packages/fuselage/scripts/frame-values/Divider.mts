import { join } from 'node:path';

import { font, textIconColor, themed } from './lib/frameTokens.mts';
import { literal } from './lib/literal.mts';
import type { Target } from './lib/target.mts';
import { textFrameDefaults } from './lib/textFrameDefaults.mts';
import { strokeColors } from '../../src/Theme.ts';
import { borderWidth, size, spacing } from '../../src/styleTokens.ts';

const component = (file: string) => join(import.meta.dirname, '../../src/components/Divider', file);

const ruleSize = () => themed('divider-size', borderWidth('default'));
const ruleColor = () => themed('divider-color', strokeColors['stroke-extra-light'].toString());

const generateDivider = () => {
	const rule = {
		render: 'hr',
		display: 'block',
		flexDirection: 'row',
		alignItems: 'normal',
		flexShrink: 1,
		minWidth: 'auto',
		minHeight: 'auto',
		borderTopWidth: ruleSize(),
		borderTopStyle: 'solid',
	};

	// One table for every border: the compiler can't resolve two conditional props that both contribute a border. A tone
	// paints every side, as the `border-color` it came from did; the default paints only the sides that have a width
	const vertical = { width: 0, borderLeftWidth: ruleSize(), borderLeftStyle: 'solid' };
	const error = strokeColors['stroke-error'].toString();
	const light = strokeColors['stroke-light'].toString();
	const medium = strokeColors['stroke-medium'].toString();
	const looks = {
		'default': { borderTopColor: ruleColor() },
		'danger': { borderColor: error },
		'light': { borderColor: light },
		'medium': { borderColor: medium },
		'vertical': { ...vertical, borderTopColor: ruleColor(), borderLeftColor: ruleColor() },
		'vertical-danger': { ...vertical, borderColor: error },
		'vertical-light': { ...vertical, borderColor: light },
		'vertical-medium': { ...vertical, borderColor: medium },
	};

	const spacings = {
		'rule': { marginBlock: spacing('x8') },
		'vertical': { marginBlock: 0, marginInline: spacing('x8') },
		'vertical-small': { marginBlock: 0, marginInline: spacing('x4') },
		'flush': { margin: 0 },
	};

	const stretches = {
		fixed: { height: size('x20')! },
		fill: { alignSelf: 'stretch', height: 'auto' },
	};

	const labelled = {
		render: 'div',
		display: 'flex',
		flexDirection: 'row',
		alignItems: 'center',
		flexShrink: 1,
		minWidth: 'auto',
		minHeight: 'auto',
		color: themed('message-divider-color', textIconColor('font-default')),
		...font('c2'),
	};

	const bar = {
		render: 'div',
		display: 'flex',
		flexDirection: 'row',
		justifyContent: 'flex-end',
		alignItems: 'center',
		flexGrow: 1,
		flexShrink: 1,
		minWidth: 'auto',
		minHeight: 'auto',
	};

	const label = {
		render: 'div',
		display: 'block',
		flexDirection: 'row',
		alignItems: 'normal',
		flexShrink: 1,
		minWidth: 'auto',
		minHeight: 'auto',
		marginBlock: spacing('x8'),
		paddingInline: spacing('x8'),
	};

	return [
		`const dividerRule = ${literal(rule)} as const;`,
		`const dividerLooks = ${literal(looks)} as const;`,
		`const dividerSpacings = ${literal(spacings)} as const;`,
		`const dividerStretches = ${literal(stretches)} as const;`,
		`const dividerLabelled = ${literal({ ...textFrameDefaults(labelled), ...labelled })} as const;`,
		`const dividerBar = ${literal(bar)} as const;`,
		`const dividerLabel = ${literal({ ...textFrameDefaults(label), ...label })} as const;`,
	].join('\n\n');
};

const generateDividerCss = () => `.rcx-divider__bar::after {
	flex-grow: 1;

	content: '';

	border: ${ruleSize()} solid ${ruleColor()};
}`;

const targets: Target[] = [
	{ file: component('Divider.tsx'), generate: generateDivider },
	{ file: component('Divider.styles.css'), generate: generateDividerCss, css: true },
];

export default targets;
