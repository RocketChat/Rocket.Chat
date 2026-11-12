import { shadowColors } from '../../../src/Theme.ts';
import { toCSSValue } from '../../../src/helpers/toCSSValue.ts';
import { backgroundColor, borderWidth, fontColor, strokeColor } from '../../../src/styleTokens.ts';

const themed = (name: string, value: string) => toCSSValue(`--rcx-input-colors-${name}`, value);

const shadow = (name: keyof typeof shadowColors) => shadowColors[name].toString();

export type InputColors = {
	background: string;
	border: string;
	color: string;
	placeholder: string;
	hoverBorder: string;
	focusBorder: string;
	focusShadow: string;
	focusIcon: string;
	focusCaret: string;
	activeBorder: string;
	activeCaret: string;
	disabledBackground: string;
	disabledBorder: string;
	disabledColor: string;
};

/** The colours of an input-like box, as `styles/variables/input-colors.scss` defines them, under the `--rcx-input-colors-*` custom properties a theme can override. */
export const inputPalettes = (): { default: InputColors; invalid: InputColors } => {
	const titles = fontColor('titles-labels');
	const hint = fontColor('hint');
	const disabledColor = fontColor('disabled');
	const light = strokeColor('light');
	const disabledBackground = backgroundColor('disabled');
	const error = strokeColor('error');

	return {
		default: {
			background: themed('background-color', backgroundColor('light')),
			border: themed('border-color', light),
			color: themed('color', titles),
			placeholder: themed('placeholder-color', hint),
			hoverBorder: themed('hover-border-color', strokeColor('dark')),
			focusBorder: themed('focus-border-color', strokeColor('highlight')),
			focusShadow: themed('focus-shadow-color', shadow('shadow-highlight')),
			focusIcon: themed('focus-icon-color', titles),
			focusCaret: themed('focus-caret-color', titles),
			activeBorder: themed('active-border-color', strokeColor('dark')),
			activeCaret: themed('active-caret-color', titles),
			disabledBackground: themed('disabled-background-color', disabledBackground),
			disabledBorder: themed('disabled-border-color', light),
			disabledColor: themed('disabled-color', disabledColor),
		},
		invalid: {
			background: themed('invalid-background-color', backgroundColor('light')),
			border: themed('invalid-border-color', error),
			color: themed('invalid-color', titles),
			placeholder: themed('invalid-placeholder-color', hint),
			hoverBorder: themed('invalid-hover-border-color', error),
			focusBorder: themed('invalid-focus-border-color', error),
			focusShadow: themed('invalid-focus-shadow-color', shadow('shadow-danger')),
			focusIcon: themed('invalid-focus-icon-color', titles),
			focusCaret: themed('invalid-focus-caret-color', titles),
			activeBorder: themed('invalid-active-border-color', error),
			activeCaret: themed('invalid-active-caret-color', titles),
			disabledBackground: themed('invalid-disabled-background-color', disabledBackground),
			disabledBorder: themed('invalid-disabled-border-color', light),
			disabledColor: themed('invalid-disabled-color', disabledColor),
		},
	};
};

/**
 * One way a selector reaches a state: an `ancestor` prefix (`*:disabled `) or a `suffix` on the element itself
 * (`:invalid`, `:has(> input:invalid)`, `.rcx-select--invalid`). A state lists its alternatives.
 */
export type Condition = { ancestor?: string; suffix?: string };

/** What puts a control in the invalid and the disabled state. */
export type InputConditions = { invalid: Condition[]; disabled: Condition[] };

/** The native states of a form control, and a disabled `fieldset` or ancestor. */
export const nativeConditions: InputConditions = {
	invalid: [{ suffix: ':invalid' }],
	disabled: [{ ancestor: '*:disabled ' }, { suffix: ':disabled' }],
};

const rule = (selectors: string[], declarations: Record<string, string>) =>
	`${[...new Set(selectors)].join(',\n')} {\n${Object.entries(declarations)
		.map(([property, value]) => `\t${property}: ${value};`)
		.join('\n')}\n}`;

/** Every selector that reaches `element` through one alternative of each state, in the order the alternatives are given. */
export const selectorsFor = (element: string, ...states: Condition[][]): string[] => {
	let combos: Condition[][] = [[]];
	for (const alternatives of states) {
		combos = combos.flatMap((chosen) => alternatives.map((condition) => [...chosen, condition]));
	}

	return combos.map(
		(chosen) => `${chosen.map(({ ancestor }) => ancestor ?? '').join('')}${element}${chosen.map(({ suffix }) => suffix ?? '').join('')}`,
	);
};

const pseudo = (...suffixes: string[]): Condition[] => suffixes.map((suffix) => ({ suffix }));

type BoxOptions = {
	/** The element that draws the border and the background. */
	element: string;
	/** Extra invalid and disabled alternatives: the part's own modifier classes and `:has(> input:<pseudo>)` of its wrapper. */
	conditions?: InputConditions;
};

/**
 * The CSS of the box of an input-like control: border, background and focus ring from rest to disabled, then the same under
 * the invalid state. Every colour comes from here, so the frame sets none of them.
 */
export const inputBoxStates = ({ element, conditions = nativeConditions }: BoxOptions) => {
	const palettes = inputPalettes();

	const states = (palette: InputColors, within: Condition[][]) => {
		const at = (...extra: Condition[][]) => selectorsFor(element, ...within, ...extra);

		return [
			rule(at(), { 'border-color': palette.border, 'background-color': palette.background, 'box-shadow': 'none' }),
			rule(at(pseudo(':hover')), { 'border-color': palette.hoverBorder }),
			rule(at(pseudo(':focus', ':focus-within')), {
				'border-color': palette.focusBorder,
				'box-shadow': `0 0 0 ${borderWidth('medium')} ${palette.focusShadow}`,
			}),
			rule(at(pseudo(':active')), { 'border-color': palette.activeBorder, 'box-shadow': 'none' }),
			rule(at(conditions.disabled), { 'border-color': palette.disabledBorder, 'background-color': palette.disabledBackground }),
		];
	};

	return [...states(palettes.default, []), ...states(palettes.invalid, [conditions.invalid])].join('\n\n');
};

type TextOptions = {
	/** The element that holds the text: the `input` or `textarea`. */
	element: string;
	/** The class that shows the placeholder colour for a value, as `.rcx-input-box--placeholder-visible` does. */
	placeholderVisible?: string;
	conditions?: InputConditions;
};

/** The text colour, placeholder and caret of an input, from rest to disabled and under the invalid state. */
export const inputTextStates = ({ element, placeholderVisible, conditions = nativeConditions }: TextOptions) => {
	const palettes = inputPalettes();

	const states = (palette: InputColors, within: Condition[][]) => {
		const at = (...extra: Condition[][]) => selectorsFor(element, ...within, ...extra);
		const placeholder = (...extra: Condition[][]) => at(...extra).map((selector) => `${selector}::placeholder`);

		return [
			rule(at(), { color: palette.color }),
			rule(placeholder(), { color: palette.placeholder }),
			...(placeholderVisible ? [rule(at([{ suffix: placeholderVisible }]), { color: palette.placeholder })] : []),
			rule(at(pseudo(':focus')), { 'caret-color': palette.focusCaret }),
			rule(at(pseudo(':active')), { 'caret-color': palette.activeCaret }),
			rule(at(conditions.disabled), { color: palette.disabledColor }),
			rule(placeholder(conditions.disabled), { color: palette.disabledColor }),
		];
	};

	return [...states(palettes.default, []), ...states(palettes.invalid, [conditions.invalid])].join('\n\n');
};

type AddonOptions = {
	/** The input the addon sits next to. */
	element: string;
	/** The addon, which follows the input or precedes it. */
	addon: string;
	conditions?: InputConditions;
};

/**
 * The colour of an addon next to an input, which follows the input's state through `input + addon` and
 * `addon:has(+ input)`, at rest, under focus, disabled and invalid. An ancestor condition only reaches the following addon.
 */
export const inputAddonStates = ({ element, addon, conditions = nativeConditions }: AddonOptions) => {
	const palettes = inputPalettes();
	const withoutAncestors = (alternatives: Condition[]) => alternatives.filter(({ ancestor }) => ancestor === undefined);

	const states = (palette: InputColors, within: Condition[][]) => {
		const reach = (...extra: Condition[][]) => [
			...selectorsFor(element, ...within, ...extra).map((selector) => `${selector} + ${addon}`),
			...selectorsFor(element, ...[...within, ...extra].map(withoutAncestors)).map((selector) => `${addon}:has(+ ${selector})`),
		];

		return [
			rule(reach(), { color: palette.color }),
			rule(reach(pseudo(':focus')), { color: palette.focusIcon }),
			rule(reach(conditions.disabled), { color: palette.disabledColor }),
		];
	};

	return [...states(palettes.default, []), ...states(palettes.invalid, [conditions.invalid])].join('\n\n');
};

/** The text fill of a date or time input, which WebKit paints over `color`: the resting colour, then the disabled one. */
export const inputTextFillStates = ({ element, conditions = nativeConditions }: Omit<TextOptions, 'placeholderVisible'>) => {
	const { default: palette } = inputPalettes();

	return [
		rule([element], { '-webkit-text-fill-color': palette.color }),
		rule(selectorsFor(element, conditions.disabled), { '-webkit-text-fill-color': palette.disabledColor }),
	].join('\n\n');
};
