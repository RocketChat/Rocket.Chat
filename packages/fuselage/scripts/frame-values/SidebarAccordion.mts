import { join } from 'node:path';

import { font, textIconColor, themed } from './lib/frameTokens.mts';
import { literal, type Value } from './lib/literal.mts';
import { sidebarPalettes } from './lib/sidebarPalettes.mts';
import type { Target } from './lib/target.mts';
import { textFrameDefaults } from './lib/textFrameDefaults.mts';
import { offScale, zIndex } from './lib/tokens.mts';
import { webDefaults } from './lib/webDefaults.mts';
import { backgroundColor, borderRadius, borderWidth, size, spacing, strokeColor } from '../../src/styleTokens.ts';

const component = (file: string) => join(import.meta.dirname, '../../src/components/Sidebar', file);

const constant = (name: string, value: Value) => `const ${name} = ${literal(value)} as const;`;

const generateAccordion = () => {
	const root = webDefaults({
		render: 'div',
		display: 'flex',
		overflow: 'hidden',
		flexDirection: 'column',
		flexWrap: 'nowrap',
		justifyContent: 'stretch',
		flexGrow: 0,
		flexShrink: 1,
		flexBasis: 'auto',
		height: size('full')!,
	});

	return [
		constant('accordionFrame', root),
		constant('wrapperFrame', webDefaults({ render: 'div', display: 'flex', overflow: 'scroll', flexDirection: 'column' })),
	].join('\n\n');
};

const generateItem = () => {
	const palettes = sidebarPalettes();
	const small = themed('border-radius-small', borderRadius('small'));
	const medium = themed('border-radius-medium', borderRadius('medium'));

	const section = webDefaults({
		render: 'section',
		display: 'flex',
		flexDirection: 'column',
		flexWrap: 'nowrap',
		flexGrow: 0,
		flexShrink: 1,
		flexBasis: 0,
		borderWidth: offScale(2),
		borderStyle: 'solid',
		borderColor: 'transparent',
		borderBlockEndWidth: borderWidth('default'),
		borderBlockEndColor: palettes.accordionBorder,
	});

	// Its padding is the 8px and 16px of the design less the 1px border an interactive bar keeps for its focus ring
	const bar = webDefaults({
		render: 'div',
		display: 'flex',
		flexDirection: 'row',
		flexWrap: 'nowrap',
		alignItems: 'center',
		position: 'sticky',
		zIndex: zIndex.sticky,
		insetBlockStart: 0,
		minHeight: size('x24')!,
		paddingBlock: offScale(7),
		paddingInline: offScale(15),
		textAlign: 'start',
		columnGap: spacing('x4')!,
		color: textIconColor('font-default'),
		borderRadius: small,
		backgroundColor: palettes.surface.default,
	});

	const modes = {
		static: {},
		interactive: {
			cursor: 'pointer',
			borderWidth: borderWidth('default'),
			borderStyle: 'solid',
			borderColor: { 'default': 'transparent', 'focus-visible': strokeColor('highlight') },
			borderRadius: { 'default': small, 'focus-visible': medium },
			backgroundColor: { default: palettes.surface.default, hover: backgroundColor('tint') },
		},
		disabled: { cursor: 'not-allowed', color: textIconColor('font-disabled') },
	};

	// The chevron shows while the bar is hovered or focused from the keyboard, and always where there is no hover to show it
	const chevron = webDefaults({
		render: 'span',
		display: 'flex',
		visibility: { 'default': 'hidden', 'group-hover/bar': 'visible', 'group-focus-visible/bar': 'visible', 'hoverNone': 'visible' },
	});

	const titleStyle = webDefaults({
		render: 'h5',
		display: 'block',
		flexGrow: 0,
		flexShrink: 1,
		flexBasis: 'auto',
		margin: 0,
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
		...font('h5'),
	});
	const title = { ...textFrameDefaults(titleStyle), ...titleStyle };

	const panel = webDefaults({
		render: 'div',
		display: 'block',
		visibility: 'hidden',
		overflow: 'hidden',
		height: 0,
		margin: 0,
		padding: 0,
	});

	return [
		constant('sectionFrame', section),
		constant('barFrame', bar),
		constant('barModes', modes),
		constant('chevronFrame', chevron),
		constant('titleFrame', title),
		constant('panelFrame', panel),
		constant('panelExpanded', {
			visibility: 'visible',
			flexGrow: 1,
			height: size('full')!,
			paddingBlockStart: spacing('x4')!,
			paddingBlockEnd: spacing('x8')!,
		}),
	].join('\n\n');
};

const targets: Target[] = [
	{ file: component('SidebarAccordion.tsx'), generate: generateAccordion },
	{ file: component('SidebarAccordionItem.tsx'), generate: generateItem },
];

export default targets;
