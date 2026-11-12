import { join } from 'node:path';

import { literal, type Value } from './lib/literal.mts';
import type { Target } from './lib/target.mts';
import { webDefaults } from './lib/webDefaults.mts';
import { strokeColors, surfaceColors } from '../../src/Theme.ts';
import { borderWidth, spacing } from '../../src/styleTokens.ts';

const component = (file: string) => join(import.meta.dirname, '../../src/components/NavBar', file);

const constant = (name: string, value: Value) => `const ${name} = ${literal(value)} as const;`;

const generateNavBar = () => {
	const bar = webDefaults({
		render: 'nav',
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		width: '100%',
		paddingBlock: spacing('x8')!,
		paddingInline: spacing('x16')!,
		borderBlockEndStyle: 'solid',
		borderBlockEndColor: strokeColors['stroke-light'].toString(),
		borderBlockEndWidth: borderWidth('default'),
		backgroundColor: surfaceColors['surface-sidebar'].toString(),
	});

	return [constant('barFrame', bar), constant('barCompact', { paddingInline: spacing('x8')! })].join('\n\n');
};

const generateSection = () => constant('sectionFrame', webDefaults({ render: 'span', display: 'flex', alignItems: 'center' }));

const targets: Target[] = [
	{ file: component('NavBar.tsx'), generate: generateNavBar },
	{ file: component('NavBarSection.tsx'), generate: generateSection },
];

export default targets;
