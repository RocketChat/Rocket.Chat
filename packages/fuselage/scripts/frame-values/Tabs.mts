import { join } from 'node:path';

import { literal } from './lib/literal.mts';
import type { Value } from './lib/literal.mts';
import type { Target } from './lib/target.mts';
import { textFrameDefaults } from './lib/textFrameDefaults.mts';
import { fontScale, offScale, radius, size, space, themed } from './lib/tokens.mts';

const component = (file: string) => join(import.meta.dirname, '../../src/components/Tabs', file);

const constant = (name: string, value: Value) => `const ${name} = ${literal(value)} as const;`;

const generateTabs = () => {
	const frame = {
		render: 'div',
		display: 'flex',
		flexDirection: 'row',
		alignItems: 'normal',
		flexShrink: 1,
		minWidth: 'auto',
		minHeight: 'auto',
		position: 'relative',
	};

	const dividers = {
		with: {
			borderBottomWidth: offScale(1),
			borderBottomStyle: 'solid',
			borderBottomColor: themed('stroke-light'),
		},
		without: {},
	};

	const layouts = { row: {}, stretch: { flexDirection: 'column' } };

	// The box scrolls, so it would clip the focus ring of its tabs: it gives back, as a negative margin, the room the
	// wrapper's padding makes for the ring
	const scrollBox = {
		render: 'div',
		display: 'block',
		flexDirection: 'row',
		alignItems: 'normal',
		flexShrink: 1,
		minWidth: 'auto',
		minHeight: 'auto',
		position: 'relative',
		overflow: 'auto',
		marginBlock: offScale(-4),
	};

	const wrapper = {
		render: 'div',
		display: 'flex',
		flexDirection: 'row',
		flexWrap: 'nowrap',
		alignItems: 'normal',
		flexShrink: 1,
		minWidth: 'auto',
		minHeight: 'auto',
		position: 'static',
		marginBlock: 0,
		marginInline: space('x12'),
		paddingBlock: space('x4'),
		paddingInline: 0,
	};

	return [
		constant('tabsFrame', frame),
		constant('tabsDividers', dividers),
		constant('tabsLayouts', layouts),
		constant('tabsScrollBoxFrame', scrollBox),
		constant('tabsWrapperFrame', wrapper),
	].join('\n\n');
};

const generateItem = () => {
	const idle = themed('font-hint');
	const hover = themed('font-default');
	const active = themed('font-titles-labels');
	const disabled = themed('font-disabled');
	const selected = themed('font-info');
	const selectedHover = themed('button-background-primary-hover');
	const selectedActive = themed('button-background-primary-press');
	const selectedDisabled = themed('status-background-info');
	const focusBorder = themed('button-background-primary-default');

	const underline = offScale(1);
	// The underline of a selected tab takes the pixel a plain one adds to its padding
	const plainPadding = offScale(5);

	const frame = {
		render: 'button',
		display: 'block',
		flexDirection: 'row',
		alignItems: 'center',
		flexGrow: 0,
		flexShrink: 0,
		flexBasis: 'auto',
		minWidth: 'auto',
		minHeight: size('x40'),
		...fontScale('h4'),
		position: 'relative',
		marginBlockStart: 0,
		marginBlockEnd: 0,
		marginInline: space('x12'),
		paddingInline: 0,
		textAlign: 'center',
		outlineStyle: 'none',
		borderTopWidth: underline,
		borderRightWidth: underline,
		borderLeftWidth: underline,
		borderBottomWidth: underline,
		borderStyle: 'solid',
		borderTopColor: { 'default': 'transparent', 'focus-visible': focusBorder },
		borderRightColor: { 'default': 'transparent', 'focus-visible': focusBorder },
		borderLeftColor: { 'default': 'transparent', 'focus-visible': focusBorder },
		borderRadius: { 'focus-visible': radius('medium') },
		backgroundColor: 'transparent',
		boxShadow: { 'focus-visible': `0 0 0 2px ${themed('stroke-extra-light-highlight')}` },
	};

	// Each look owns the color, the underline color and the padding of a selected and disabled pair. The stylesheet this
	// replaces stated the hover and press rules before the selected and disabled ones at the same specificity, so a look
	// states which of its states still apply: a disabled tab keeps its hover underline, and a selected one the color of
	// its own state
	const looks: Record<string, Value> = {
		idle: {
			cursor: 'pointer',
			paddingBlock: plainPadding,
			color: { default: idle, hover, press: active },
			borderBottomColor: { 'default': 'transparent', hover, 'press': active, 'focus-visible': focusBorder },
		},
		disabled: {
			cursor: 'not-allowed',
			paddingBlock: plainPadding,
			color: { default: disabled, hover: disabled, press: active },
			borderBottomColor: { 'default': 'transparent', hover, 'press': active, 'focus-visible': focusBorder },
		},
		selected: {
			cursor: 'pointer',
			paddingBlock: space('x4'),
			color: { default: selected, hover: selectedHover, press: selectedActive },
			borderBottomColor: { default: selected, hover: selectedHover, press: selectedActive },
		},
		selectedDisabled: {
			cursor: 'not-allowed',
			paddingBlock: space('x4'),
			color: selectedDisabled,
			borderBottomColor: selectedDisabled,
		},
	};

	// A tab bar with a divider holds the underline at 1px: the divider's rule came after the hover and press rules. The
	// width is part of the look because the compiler can't resolve two conditionals that both contribute a border
	const grows = { borderBottomWidth: { default: underline, hover: space('x4'), press: space('x4') } };
	looks['idle-grows'] = { ...(looks.idle as Record<string, Value>), ...grows };
	looks['disabled-grows'] = { ...(looks.disabled as Record<string, Value>), ...grows };

	const dividers = { with: { marginBlockEnd: offScale(-1) }, without: {} };
	const stretches = { stretch: { flexGrow: 1 }, fixed: {} };

	return [
		constant('tabsItemFrame', { ...textFrameDefaults(frame), ...frame }),
		constant('tabsItemLooks', looks),
		constant('tabsItemDividers', dividers),
		constant('tabsItemStretches', stretches),
	].join('\n\n');
};

export default [
	{ file: component('Tabs.tsx'), generate: generateTabs },
	{ file: component('TabsItem.tsx'), generate: generateItem },
] satisfies Target[];
