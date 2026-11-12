import { join } from 'node:path';

import { literal, type Value } from './lib/literal.mts';
import { sidebarPalettes } from './lib/sidebarPalettes.mts';
import type { Target } from './lib/target.mts';
import { webDefaults } from './lib/webDefaults.mts';
import { size, spacing } from '../../src/styleTokens.ts';

const component = (file: string) => join(import.meta.dirname, '../../src/components/Sidebar', file);

const constant = (name: string, value: Value) => `const ${name} = ${literal(value)} as const;`;

const generateSidebar = () => {
	const palettes = sidebarPalettes();

	return constant(
		'sidebarFrame',
		webDefaults({
			render: 'nav',
			display: 'flex',
			flexDirection: 'column',
			position: 'relative',
			height: size('full')!,
			color: palettes.font.default,
			backgroundColor: palettes.surface.default,
		}),
	);
};

const generateSection = () =>
	constant(
		'sectionFrame',
		webDefaults({
			render: 'div',
			display: 'flex',
			alignItems: 'center',
			height: size('x44')!,
			paddingInline: spacing('x16')!,
			gap: spacing('x8')!,
		}),
	);

const targets: Target[] = [
	{ file: component('Sidebar.tsx'), generate: generateSidebar },
	{ file: component('SidebarSection.tsx'), generate: generateSection },
];

export default targets;
