import { join } from 'node:path';

import { font, themed } from './lib/frameTokens.mts';
import { literal, type Value } from './lib/literal.mts';
import { sidebarPalettes } from './lib/sidebarPalettes.mts';
import type { Target } from './lib/target.mts';
import { textFrameDefaults } from './lib/textFrameDefaults.mts';
import { webDefaults } from './lib/webDefaults.mts';
import { borderRadius, borderWidth, fontColor, fontFamily, spacing, strokeColor } from '../../src/styleTokens.ts';

const component = (file: string) => join(import.meta.dirname, '../../src/components/Sidebar/SidebarItem', file);

const generateSidebarItemAction = () => {
	const palettes = sidebarPalettes();
	const thin = borderWidth('default');
	const linkColor = fontColor('default');

	const style = webDefaults({
		render: 'div',
		display: 'flex',
		justifyContent: 'flex-start',
		alignItems: 'center',
		overflow: 'hidden',
		paddingBlock: `calc(${spacing('x4')} - ${thin})`,
		paddingInline: `calc(${spacing('x16')} - ${thin})`,
		cursor: 'pointer',
		whiteSpace: 'nowrap',
		textDecorationLine: 'none',
		textOverflow: 'ellipsis',
		color: {
			'default': themed('link-color', linkColor),
			'focus': themed('link-focus-color', linkColor),
			'focus-within': themed('link-focus-color', linkColor),
			'press': themed('sidebar-color-font-active', fontColor('titles-labels')),
		},
		borderWidth: thin,
		borderStyle: 'solid',
		borderColor: { 'default': 'transparent', 'focus-visible': strokeColor('highlight') },
		borderRadius: { 'default': borderRadius('small'), 'focus-visible': borderRadius('medium') },
		outlineWidth: 0,
		outlineStyle: 'none',
		backgroundColor: { hover: palettes.surface.hover },
		fontFamily: fontFamily('sans'),
		gap: spacing('x4')!,
		...font('p2'),
	});

	const frame: Record<string, Value> = { ...textFrameDefaults(style), ...style };

	return [
		`const sidebarItemActionFrame = ${literal(frame)} as const;`,
		`const sidebarItemActionSelected = ${literal({ backgroundColor: palettes.surface.selected })} as const;`,
	].join('\n\n');
};

const targets: Target[] = [{ file: component('SidebarItemAction.tsx'), generate: generateSidebarItemAction }];

export default targets;
