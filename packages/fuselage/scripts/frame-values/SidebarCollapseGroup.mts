import { join } from 'node:path';

import { font } from './lib/frameTokens.mts';
import { literal, type Value } from './lib/literal.mts';
import { sidebarPalettes } from './lib/sidebarPalettes.mts';
import type { Target } from './lib/target.mts';
import { textFrameDefaults } from './lib/textFrameDefaults.mts';
import { webDefaults } from './lib/webDefaults.mts';
import { fontColor, spacing } from '../../src/styleTokens.ts';

const component = (file: string) => join(import.meta.dirname, '../../src/components/Sidebar', file);

const constant = (name: string, value: Value) => `const ${name} = ${literal(value)} as const;`;

const generateSidebarCollapseGroup = () => {
	const frame = webDefaults({ render: 'div', display: 'flex', flexDirection: 'column', alignItems: 'normal', flexShrink: 1 });

	return [constant('sidebarCollapseGroupFrame', frame), constant('sidebarCollapseGroupDragging', { opacity: 0.4 })].join('\n\n');
};

const generateSidebarGroupTitle = () => {
	const palettes = sidebarPalettes();

	// The heading holds the chevron and the title, which are all a state recolors: the header's own color is the resting one
	const heading = webDefaults({
		render: 'div',
		display: 'flex',
		alignItems: 'center',
		flexGrow: 1,
		flexShrink: 1,
		flexBasis: 0,
		minWidth: 0,
		columnGap: spacing('x4')!,
	});

	const tones = {
		empty: { color: fontColor('disabled') },
		unread: { color: palettes.font.highlighted },
	};

	const title = webDefaults({
		render: 'h4',
		display: 'block',
		overflow: 'hidden',
		flexGrow: 0,
		flexShrink: 1,
		flexBasis: 'auto',
		margin: 0,
		whiteSpace: 'nowrap',
		textOverflow: 'ellipsis',
		fontVariantNumeric: 'inherit',
		fontFamily: 'inherit',
		...font('c1'),
	});

	return [
		constant('sidebarGroupHeadingFrame', heading),
		constant('sidebarGroupHeadingTones', tones),
		constant('sidebarGroupTitleFrame', { ...textFrameDefaults(title), ...title }),
		constant('sidebarGroupTitleUnread', font('c2')),
	].join('\n\n');
};

const targets: Target[] = [
	{ file: component('SidebarCollapseGroup.tsx'), generate: generateSidebarCollapseGroup },
	{ file: component('SidebarGroupTitle.tsx'), generate: generateSidebarGroupTitle },
];

export default targets;
