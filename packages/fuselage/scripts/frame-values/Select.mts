import { join } from 'node:path';

import { font, textIconColor, themed } from './lib/frameTokens.mts';
import { inputFrame } from './lib/inputFrame.mts';
import {
	inputAddonStates,
	inputBoxStates,
	inputPalettes,
	selectorsFor,
	type Condition,
	type InputConditions,
} from './lib/inputPalettes.mts';
import { literal, type Value } from './lib/literal.mts';
import type { Target } from './lib/target.mts';
import { textFrameDefaults } from './lib/textFrameDefaults.mts';
import { offScale } from './lib/tokens.mts';
import { webDefaults } from './lib/webDefaults.mts';
import { borderRadius, borderWidth, size, spacing } from '../../src/styleTokens.ts';

const component = (file: string) => join(import.meta.dirname, '../../src/components', file);

const radius = () => themed('input-border-radius', themed('border-radius-medium', borderRadius('medium')));

const text = (style: Record<string, Value>) => ({ ...textFrameDefaults(style), ...style });

const generateBox = () => {
	const frame = webDefaults({
		render: 'div',
		position: 'relative',
		display: 'inline-flex',
		flexWrap: 'nowrap',
		alignItems: 'center',
		flexGrow: 1,
		flexBasis: 'auto',
		minWidth: size('x144')!,
		minHeight: size('x40')!,
		paddingBlock: spacing('x8')!,
		// The padding of a bordered box leaves room for its border: 16px less the 1px of the border
		paddingInline: offScale(16 - 1),
		verticalAlign: 'baseline',
		wordBreak: 'break-all',
		outlineStyle: 'none',
		borderWidth: borderWidth('default'),
		borderStyle: 'solid',
		borderRadius: radius(),
	});

	// The room a layout's content needs inside the border; the wrapper and the field no longer carry negative margins
	const trigger = { display: 'flex', justifyContent: 'space-between', ...font('p2') };
	const layouts = {
		'plain': {},
		trigger,
		// A small box is a fixed padding, whatever the border takes
		'trigger-small': {
			...trigger,
			minWidth: size('x112')!,
			minHeight: size('x28')!,
			paddingBlock: spacing('x4')!,
			paddingInline: spacing('x8')!,
		},
		'wrapped': { paddingInline: offScale(16 - 1 - 4) },
		'multi': { paddingBlock: spacing('x4')! },
	};

	return [`const selectBoxFrame = ${literal(frame)} as const;`, `const selectBoxLayouts = ${literal(layouts)} as const;`].join('\n\n');
};

const generateLayout = () => {
	const wrapper = webDefaults({
		render: 'div',
		display: 'flex',
		alignItems: 'center',
		flexGrow: 1,
		flexBasis: 'auto',
		minWidth: 0,
		userSelect: 'none',
		whiteSpace: 'nowrap',
	});

	const field = webDefaults({ render: 'div', display: 'flex', flexGrow: 1 });

	const values = webDefaults({
		render: 'div',
		display: 'flex',
		flexWrap: 'wrap',
		alignItems: 'center',
		gap: spacing('x4')!,
	});

	const item = text({
		render: 'span',
		display: 'inline',
		flexDirection: 'row',
		alignItems: 'normal',
		flexGrow: 1,
		flexShrink: 1,
		minWidth: 'auto',
		minHeight: 'auto',
		marginInline: spacing('x4')!,
		color: textIconColor('font-titles-labels'),
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		...font('p2'),
	});

	const value = text({
		render: 'span',
		display: 'inline',
		flexDirection: 'row',
		alignItems: 'normal',
		flexShrink: 1,
		minWidth: 'auto',
		minHeight: 'auto',
		color: textIconColor('font-titles-labels'),
	});

	const placeholder = { color: textIconColor('font-hint') };

	return [
		`const selectWrapperFrame = ${literal(wrapper)} as const;`,
		`const selectFieldFrame = ${literal(field)} as const;`,
		`const selectValuesFrame = ${literal(values)} as const;`,
		`const selectValuesSpacious = ${literal({ gap: spacing('x8')! })} as const;`,
		`const selectItemFrame = ${literal(item)} as const;`,
		`const selectItemMedium = ${literal(font('p2m'))} as const;`,
		`const selectValueFrame = ${literal(value)} as const;`,
		`const selectValueSmall = ${literal(font('c1'))} as const;`,
		`const selectPlaceholder = ${literal(placeholder)} as const;`,
	].join('\n\n');
};

const generateAddon = () => {
	const frame = webDefaults({
		render: 'div',
		display: 'flex',
		flexWrap: 'nowrap',
		alignItems: 'flex-start',
		flexGrow: 0,
		flexBasis: 'auto',
		flexShrink: 0,
		marginInline: spacing('x4')!,
		cursor: 'pointer',
		outlineStyle: 'none',
	});

	return `const selectAddonFrame = ${literal(frame)} as const;`;
};

const generateFocus = () => {
	// The anchor collapses while the wrapper shows the value, through the wrapper's custom properties
	const frame = text({
		render: 'button',
		display: 'inline-block',
		flexDirection: 'row',
		alignItems: 'normal',
		flexShrink: 1,
		minWidth: 'auto',
		minHeight: 'auto',
		width: 'var(--rcx-select-focus-width, auto)',
		opacity: 'var(--rcx-select-focus-opacity, 1)',
		cursor: 'pointer',
		outlineStyle: 'none',
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		userSelect: 'none',
		textAlign: 'start',
		verticalAlign: 'middle',
		whiteSpace: 'nowrap',
		textDecorationLine: 'none',
		backgroundColor: 'inherit',
		appearance: 'none',
		color: textIconColor('font-hint'),
		...font('p2m'),
	});

	return [
		`const selectFocusFrame = ${literal(frame)} as const;`,
		`const selectFocusDisabled = ${literal({ cursor: 'not-allowed' })} as const;`,
		`const selectFocusLast = ${literal({ order: 1 })} as const;`,
	].join('\n\n');
};

const generateFilter = () => {
	// The anchor collapses while the wrapper shows the value, through the wrapper's custom properties
	const frame = {
		...inputFrame(),
		display: 'inline-block',
		flexShrink: 1,
		minWidth: 'auto',
		appearance: 'none',
		userSelect: 'none',
		verticalAlign: 'middle',
		marginInline: spacing('x4')!,
		opacity: 'var(--rcx-select-focus-opacity, 1)',
	};

	return `const selectFilterFrame = ${literal(frame)} as const;`;
};

const generateAutoComplete = () => {
	const group = webDefaults({
		render: 'div',
		display: 'flex',
		flexWrap: 'wrap',
		alignItems: 'center',
		flexGrow: 1,
		gap: spacing('x4')!,
	});

	const addon = webDefaults({ render: 'div', color: textIconColor('font-titles-labels') });

	return [`const autoCompleteGroupFrame = ${literal(group)} as const;`, `const autoCompleteAddonFrame = ${literal(addon)} as const;`].join(
		'\n\n',
	);
};

const generatePopup = () => {
	const frame = webDefaults({ render: 'div' });

	return [
		`const selectPopupFrame = ${literal(frame)} as const;`,
		`const selectPopupClosed = ${literal({ pointerEvents: 'none' })} as const;`,
	].join('\n\n');
};

const block = (selectors: string[], declarations: Record<string, string>) =>
	`${[...new Set(selectors)].join(',\n')} {\n${Object.entries(declarations)
		.map(([property, value]) => `\t${property}: ${value};`)
		.join('\n')}\n}`;

const conditionsOf = (root: string): InputConditions => ({
	invalid: [{ suffix: `.${root}--invalid` }],
	disabled: [{ ancestor: '*:disabled ' }, { suffix: ':disabled' }, { suffix: `.${root}--disabled` }],
});

const nativeDisabled: Condition[] = [{ ancestor: '*:disabled ' }, { suffix: ':disabled' }];

// What the old `with-colors` gave an invalid box: its text colour, caret and disabled colour
const invalidText = (root: string) => {
	const { invalid } = inputPalettes();
	const element = `.${root}`;
	const conditions = conditionsOf(root);
	const within = [conditions.invalid];

	return [
		block(selectorsFor(element, ...within), { color: invalid.color }),
		block(selectorsFor(element, ...within, [{ suffix: ':focus' }]), { 'caret-color': invalid.focusCaret }),
		block(selectorsFor(element, ...within, [{ suffix: ':active' }]), { 'caret-color': invalid.activeCaret }),
		block(selectorsFor(element, ...within, conditions.disabled), { color: invalid.disabledColor }),
	].join('\n\n');
};

const generateBoxStates = (root: string) => {
	const element = `.${root}`;
	const conditions = conditionsOf(root);

	return [
		inputBoxStates({ element, conditions }),
		invalidText(root),
		block(selectorsFor(element, nativeDisabled), { 'cursor': 'not-allowed', 'pointer-events': 'none' }),
		block([`${element}.${root}--disabled`], { 'pointer-events': 'none' }),
	].join('\n\n');
};

const generateCss = () => {
	const { default: palette, invalid } = inputPalettes();
	const focus = (colors: typeof palette) => ({
		'border-color': colors.focusBorder,
		'box-shadow': `0 0 0 ${borderWidth('medium')} ${colors.focusShadow}`,
	});

	return [
		'/* State of a native form control: the box of a select and of the autocomplete follows its own invalid and disabled classes and a disabled fieldset */',
		generateBoxStates('rcx-select'),
		generateBoxStates('rcx-autocomplete'),
		'/* An open select keeps the focus look while focus is in its listbox */',
		block(["[aria-expanded='true'].rcx-select"], focus(palette)),
		block(["[aria-expanded='true'].rcx-select.rcx-select--invalid"], focus(invalid)),
		'/* State of a native form control: the addon after the filter input follows it */',
		inputAddonStates({ element: '.rcx-input-box', addon: '.rcx-select__addon' }),
		block(
			selectorsFor('.rcx-input-box', nativeDisabled).map((selector) => `${selector} + .rcx-select__addon`),
			{ 'pointer-events': 'none' },
		),
		'/* Not a frame: the cursor of the filter input, which the disabled cursor of the input box wins over */',
		block(['.rcx-input-box.rcx-select__focus:not(:disabled)'], { cursor: 'pointer' }),
		'/* Component-scoped custom property inputs: the anchor collapses while the wrapper shows the value. A frame never sets transition */',
		block(['.rcx-select__wrapper--hidden'], { '--rcx-select-focus-width': '0', '--rcx-select-focus-opacity': '0' }),
		block(['.rcx-select__wrapper--hidden > .rcx-select__focus'], { transition: 'none' }),
		'/* Component-scoped custom property inputs: the widest a chip of a select grows */',
		block(['.rcx-select__chip'], { '--rcx-chip-max-width': size('x150')! }),
	].join('\n\n');
};

export default [
	{ file: component('Select/SelectBox.tsx'), generate: generateBox },
	{ file: component('Select/SelectLayout.tsx'), generate: generateLayout },
	{ file: component('Select/SelectAddon.tsx'), generate: generateAddon },
	{ file: component('Select/SelectFocus.tsx'), generate: generateFocus },
	{ file: component('Select/SelectFilter.tsx'), generate: generateFilter },
	{ file: component('Select/SelectPopup.tsx'), generate: generatePopup },
	{ file: component('AutoComplete/AutoComplete.tsx'), generate: generateAutoComplete },
	{ file: component('Select/Select.styles.css'), generate: generateCss, css: true },
] satisfies Target[];
