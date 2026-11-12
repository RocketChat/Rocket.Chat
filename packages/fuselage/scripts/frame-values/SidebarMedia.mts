import { join } from 'node:path';

import { font } from './lib/frameTokens.mts';
import { literal, type Value } from './lib/literal.mts';
import { sidebarPalettes } from './lib/sidebarPalettes.mts';
import type { Target } from './lib/target.mts';
import { textFrameDefaults } from './lib/textFrameDefaults.mts';
import { webDefaults } from './lib/webDefaults.mts';
import { borderWidth, spacing } from '../../src/styleTokens.ts';

const component = (file: string) => join(import.meta.dirname, '../../src/components/Sidebar/SidebarMedia', file);

const constant = (name: string, value: Value) => `const ${name} = ${literal(value)} as const;`;

const textFrame = (frame: Record<string, Value>) => ({ ...textFrameDefaults(frame), ...frame });

const generateMedia = () => {
	const palettes = sidebarPalettes();

	return constant(
		'mediaFrame',
		webDefaults({
			render: 'div',
			display: 'block',
			paddingBlock: spacing('x8')!,
			color: palettes.media.color,
			borderBlockEndStyle: 'solid',
			borderBlockEndColor: palettes.media.border,
			borderBlockEndWidth: borderWidth('default'),
			backgroundColor: palettes.surface.default,
		}),
	);
};

const generateTitle = () =>
	constant(
		'titleFrame',
		textFrame(
			webDefaults({
				render: 'div',
				display: 'block',
				flexGrow: 1,
				paddingBlockEnd: spacing('x4')!,
				paddingInline: spacing('x16')!,
				textAlign: 'center',
				...font('c1'),
			}),
		),
	);

const generateController = () =>
	constant(
		'controllerFrame',
		webDefaults({
			render: 'div',
			display: 'flex',
			justifyContent: 'space-between',
			alignItems: 'center',
			paddingInline: spacing('x16')!,
		}),
	);

const generateLabel = () => constant('labelFrame', textFrame(webDefaults({ render: 'div', display: 'block', ...font('p2') })));

const targets: Target[] = [
	{ file: component('SidebarMedia.tsx'), generate: generateMedia },
	{ file: component('SidebarMediaTitle.tsx'), generate: generateTitle },
	{ file: component('SidebarMediaController.tsx'), generate: generateController },
	{ file: component('SidebarMediaController.tsx'), generate: generateLabel, section: 'label' },
];

export default targets;
