import { join } from 'node:path';

import { literal } from './lib/literal.mts';
import type { Value } from './lib/literal.mts';
import type { Target } from './lib/target.mts';
import { percent, space, themed } from './lib/tokens.mts';
import { webDefaults } from './lib/webDefaults.mts';

const component = (file: string) => join(import.meta.dirname, '../../src/components/NavBar', file);

const constant = (name: string, value: Value) => `const ${name} = ${literal(value)} as const;`;

const generateNavBar = () => {
	// Only the bottom side has a border, so its style is stated for that side: `borderStyle` would give the other three a width
	const bar = webDefaults({
		render: 'nav',
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		width: percent(100),
		paddingBlock: space('x8'),
		paddingInline: space('x16'),
		borderBlockEndStyle: 'solid',
		borderBlockEndColor: themed('stroke-light'),
		borderBlockEndWidth: 1,
		backgroundColor: themed('surface-sidebar'),
	});

	return [constant('barFrame', bar), constant('barCompact', { paddingInline: space('x8') })].join('\n\n');
};

const generateSection = () => constant('sectionFrame', webDefaults({ render: 'span', display: 'flex', alignItems: 'center' }));

export default [
	{ file: component('NavBar.tsx'), generate: generateNavBar },
	{ file: component('NavBarSection.tsx'), generate: generateSection },
] satisfies Target[];
