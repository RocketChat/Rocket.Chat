import { join } from 'node:path';

import { font, textIconColor } from './lib/frameTokens.mts';
import { literal, type Value } from './lib/literal.mts';
import type { Target } from './lib/target.mts';
import { textFrameDefaults } from './lib/textFrameDefaults.mts';
import { webDefaults } from './lib/webDefaults.mts';
import { surfaceColors } from '../../src/Theme.ts';
import { size, spacing } from '../../src/styleTokens.ts';

const component = (file: string) => join(import.meta.dirname, '../../src/components/Sidebar/SidebarFooter', file);

const constant = (name: string, value: Value) => `const ${name} = ${literal(value)} as const;`;

const generateFooter = () =>
	constant(
		'footerFrame',
		webDefaults({
			render: 'footer',
			display: 'flex',
			flexDirection: 'column',
			justifyContent: 'center',
			minHeight: size('x48')!,
			paddingBlockStart: spacing('x12')!,
			paddingBlockEnd: spacing('x8')!,
			paddingInline: spacing('x16')!,
			color: textIconColor('font-default'),
			backgroundColor: surfaceColors['surface-sidebar'].toString(),
			gap: spacing('x4')!,
		}),
	);

const generateContent = () => {
	const content = webDefaults({ render: 'div', display: 'block', ...font('micro') });

	return constant('contentFrame', { ...textFrameDefaults(content), ...content });
};

const targets: Target[] = [
	{ file: component('SidebarFooter.tsx'), generate: generateFooter },
	{ file: component('SidebarFooterContent.tsx'), generate: generateContent },
];

export default targets;
