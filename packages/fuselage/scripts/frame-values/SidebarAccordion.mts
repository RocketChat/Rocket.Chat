import { join } from 'node:path';

import { literal } from './lib/literal.mts';
import type { Value } from './lib/literal.mts';
import type { Target } from './lib/target.mts';
import { textFrameDefaults } from './lib/textFrameDefaults.mts';
import { fontScale, offScale, percent, radius, size, space, themed, zIndex } from './lib/tokens.mts';
import { webDefaults } from './lib/webDefaults.mts';

const component = (file: string) => join(import.meta.dirname, '../../src/components/Sidebar', file);

const constant = (name: string, value: Value) => `const ${name} = ${literal(value)} as const;`;

const generateAccordion = () =>
	[
		constant(
			'accordionFrame',
			webDefaults({
				render: 'div',
				display: 'flex',
				overflow: 'hidden',
				flexDirection: 'column',
				flexWrap: 'nowrap',
				justifyContent: 'stretch',
				flexGrow: 0,
				flexShrink: 1,
				flexBasis: 'auto',
				height: percent(100),
			}),
		),
		constant('wrapperFrame', webDefaults({ render: 'div', display: 'flex', overflow: 'scroll', flexDirection: 'column' })),
	].join('\n\n');

const generateItem = () => {
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
		borderBlockEndWidth: 1,
		borderBlockEndColor: themed('stroke-light'),
	});

	// Its padding is the 8px and 16px of the design less the 1px border an interactive bar keeps for its focus ring
	const bar = webDefaults({
		render: 'div',
		display: 'flex',
		flexDirection: 'row',
		flexWrap: 'nowrap',
		alignItems: 'center',
		position: 'sticky',
		zIndex: zIndex('raised'),
		insetBlockStart: 0,
		minHeight: size('x24'),
		paddingBlock: offScale(7),
		paddingInline: offScale(15),
		textAlign: 'start',
		columnGap: space('x4'),
		color: themed('font-default'),
		borderRadius: radius('small'),
		backgroundColor: themed('surface-sidebar'),
	});

	const modes = {
		static: {},
		interactive: {
			cursor: 'pointer',
			borderWidth: 1,
			borderStyle: 'solid',
			borderColor: { 'default': 'transparent', 'focus-visible': themed('stroke-highlight') },
			borderRadius: { 'default': radius('small'), 'focus-visible': radius('medium') },
			backgroundColor: { default: themed('surface-sidebar'), hover: themed('surface-tint') },
		},
		disabled: { cursor: 'not-allowed', color: themed('font-disabled') },
	};

	// The chevron shows while the bar is hovered or focused from the keyboard
	const chevron = webDefaults({
		render: 'span',
		display: 'flex',
		visibility: { 'default': 'hidden', 'group-hover/bar': 'visible', 'group-focus-visible/bar': 'visible' },
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
		...fontScale('h5'),
	});

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
		constant('titleFrame', { ...textFrameDefaults(titleStyle), ...titleStyle }),
		constant('panelFrame', panel),
		constant('panelExpanded', {
			visibility: 'visible',
			flexGrow: 1,
			height: percent(100),
			paddingBlockStart: space('x4'),
			paddingBlockEnd: space('x8'),
		}),
	].join('\n\n');
};

export default [
	{ file: component('SidebarAccordion.tsx'), generate: generateAccordion },
	{ file: component('SidebarAccordionItem.tsx'), generate: generateItem },
] satisfies Target[];
