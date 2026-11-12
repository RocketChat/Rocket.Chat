import { join } from 'node:path';

import { buttonBackground } from './lib/buttonPalettes.mts';
import { font, textIconColor, themed } from './lib/frameTokens.mts';
import { literal, type Value } from './lib/literal.mts';
import type { Target } from './lib/target.mts';
import { textFrameDefaults } from './lib/textFrameDefaults.mts';
import { offScale } from './lib/tokens.mts';
import { statusBackgroundColors, strokeColors } from '../../src/Theme.ts';
import { borderRadius, borderWidth, spacing } from '../../src/styleTokens.ts';

const component = (file: string) => join(import.meta.dirname, '../../src/components/Tabs', file);

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
			borderBottomWidth: borderWidth('default'),
			borderBottomStyle: 'solid',
			borderBottomColor: strokeColors['stroke-light'].toString(),
		},
		without: {},
	};

	const layouts = { row: {}, stretch: { flexDirection: 'column' } };

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
		marginBlock: spacing('-x4')!,
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
		marginInline: spacing('x12')!,
		paddingBlock: spacing('x4')!,
		paddingInline: 0,
	};

	return [
		`const tabsFrame = ${literal(frame)} as const;`,
		`const tabsDividers = ${literal(dividers)} as const;`,
		`const tabsLayouts = ${literal(layouts)} as const;`,
		`const tabsScrollBoxFrame = ${literal(scrollBox)} as const;`,
		`const tabsWrapperFrame = ${literal(wrapper)} as const;`,
	].join('\n\n');
};

const generateItem = () => {
	const color = (name: string, value: string) => themed(`tabs-${name}`, value);

	const idle = color('color', textIconColor('font-hint'));
	const hover = color('hover-border-color', textIconColor('font-default'));
	const active = color('active-color', textIconColor('font-titles-labels'));
	const disabled = color('disabled-color', textIconColor('font-disabled'));
	const selected = color('selected-color', textIconColor('font-info'));
	const selectedBorder = color('selected-border-color', textIconColor('font-info'));
	const selectedHover = color('hover-selected-color', buttonBackground('primary', 'hover'));
	const selectedHoverBorder = color('hover-selected-border-color', buttonBackground('primary', 'hover'));
	const selectedActive = color('active-selected-color', buttonBackground('primary', 'press'));
	const selectedActiveBorder = color('active-selected-border-color', buttonBackground('primary', 'press'));
	const selectedDisabled = color('disabled-selected-color', statusBackgroundColors['status-background-info'].toString());
	const selectedDisabledBorder = color('disabled-selected-border-color', statusBackgroundColors['status-background-info'].toString());
	const focusBorder = color('focus-border-color', buttonBackground('primary', 'default'));
	const focusShadow = color('focus-shadow-color', strokeColors['stroke-extra-light-highlight'].toString());
	const radius = color('border-radius', borderRadius('medium'));

	const underline = borderWidth('default');
	const plainPadding = `calc(${spacing('x4')} + ${underline})`;

	const frame = {
		render: 'button',
		display: 'block',
		flexDirection: 'row',
		alignItems: 'center',
		flexGrow: 0,
		flexShrink: 0,
		flexBasis: 'auto',
		minWidth: 'auto',
		minHeight: spacing('x40')!,
		position: 'relative',
		marginBlockStart: 0,
		marginBlockEnd: 0,
		marginInline: spacing('x12')!,
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
		borderRadius: { 'focus-visible': radius },
		backgroundColor: 'transparent',
		boxShadow: { 'focus-visible': `0 0 0 ${borderWidth('medium')} ${focusShadow}` },
		...font('h4'),
	};

	// Each look owns the colour, the underline colour and the padding of a selected × disabled pair. On `develop` the hover
	// and press rules come before the selected and disabled ones at the same specificity, so a look states which of its
	// states still apply: a disabled tab keeps its hover underline, and a selected one the colour of its own state
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
			paddingBlock: spacing('x4')!,
			color: { default: selected, hover: selectedHover, press: selectedActive },
			borderBottomColor: { default: selectedBorder, hover: selectedHoverBorder, press: selectedActiveBorder },
		},
		selectedDisabled: {
			cursor: 'not-allowed',
			paddingBlock: spacing('x4')!,
			color: selectedDisabled,
			borderBottomColor: selectedDisabledBorder,
		},
	};

	// A tab bar with a divider holds the underline at 1px: the divider's rule comes after the hover and press rules. The
	// width is part of the look because the compiler can't resolve two conditionals that both contribute a border
	const grows = { borderBottomWidth: { default: underline, hover: borderWidth('large'), press: borderWidth('large') } };
	looks['idle-grows'] = { ...(looks.idle as Record<string, Value>), ...grows };
	looks['disabled-grows'] = { ...(looks.disabled as Record<string, Value>), ...grows };

	const dividers = { with: { marginBlockEnd: offScale(-1) }, without: {} };
	const stretches = { stretch: { flexGrow: 1 }, fixed: {} };

	return [
		`const tabsItemFrame = ${literal({ ...textFrameDefaults(frame), ...frame })} as const;`,
		`const tabsItemLooks = ${literal(looks)} as const;`,
		`const tabsItemDividers = ${literal(dividers)} as const;`,
		`const tabsItemStretches = ${literal(stretches)} as const;`,
	].join('\n\n');
};

export default [
	{ file: component('Tabs.tsx'), generate: generateTabs },
	{ file: component('TabsItem.tsx'), generate: generateItem },
] satisfies Target[];
