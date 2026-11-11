import { buttonBackground, buttonFont } from './buttonPalettes.mts';
import { literal } from './literal.mts';
import type { Value } from './literal.mts';
import { textFrameDefaults } from './textFrameDefaults.mts';
import { zIndex } from './tokens.mts';
import { shadowColors, strokeColors } from '../../../src/Theme.ts';
import { toCSSValue } from '../../../src/helpers/toCSSValue.ts';
import { backgroundColor, borderWidth, fontColor, size } from '../../../src/styleTokens.ts';

/** The colours of the fake of a CheckBox, RadioButton or ToggleSwitch: unchecked on `empty` or `off`, checked on `primary`. */
export const selectionColors = () => {
	const stroke = (name: string) => strokeColors[`stroke-${name}` as keyof typeof strokeColors].toString();
	const surface = backgroundColor('light');
	const rule = (kind: string, name: string, value: string) => toCSSValue(`--rcx-button-${kind}-${name}`, value);
	const white = fontColor('white');
	const hint = fontColor('hint');
	const extraDark = stroke('extra-dark');
	const secondaryDisabled = buttonBackground('secondary', 'disabled');

	const palette = (
		kind: string,
		c: {
			color: string;
			border: string;
			background: string;
			hover: [string, string];
			active: [string, string];
			focus: [string, string];
			disabled: [string, string, string];
		},
	) => ({
		color: rule(kind, 'color', c.color),
		border: rule(kind, 'border-color', c.border),
		background: rule(kind, 'background-color', c.background),
		hover: { border: rule(kind, 'hover-border-color', c.hover[0]), background: rule(kind, 'hover-background-color', c.hover[1]) },
		active: { border: rule(kind, 'active-border-color', c.active[0]), background: rule(kind, 'active-background-color', c.active[1]) },
		focus: { border: rule(kind, 'focus-border-color', c.focus[0]), background: rule(kind, 'focus-background-color', c.focus[1]) },
		disabled: {
			color: rule(kind, 'disabled-color', c.disabled[0]),
			border: rule(kind, 'disabled-border-color', c.disabled[1]),
			background: rule(kind, 'disabled-background-color', c.disabled[2]),
		},
	});

	return {
		empty: palette('empty', {
			color: white,
			border: stroke('dark'),
			background: surface,
			hover: [extraDark, surface],
			active: [extraDark, surface],
			focus: [extraDark, surface],
			disabled: [white, stroke('light'), secondaryDisabled],
		}),
		off: palette('off', {
			color: white,
			border: stroke('medium'),
			background: stroke('medium'),
			hover: [hint, hint],
			active: [stroke('dark'), stroke('dark')],
			focus: [extraDark, stroke('medium')],
			disabled: [buttonFont('secondary-disabled'), secondaryDisabled, secondaryDisabled],
		}),
		primary: palette('primary', {
			color: buttonFont('primary'),
			border: buttonBackground('primary', 'default'),
			background: buttonBackground('primary', 'default'),
			hover: [buttonBackground('primary', 'hover'), buttonBackground('primary', 'hover')],
			active: [buttonBackground('primary', 'press'), buttonBackground('primary', 'press')],
			focus: [extraDark, buttonBackground('primary', 'focus')],
			disabled: [buttonFont('primary-disabled'), buttonBackground('primary', 'disabled'), buttonBackground('primary', 'disabled')],
		}),
	};
};

type Palette = ReturnType<typeof selectionColors>['empty'];

export type SelectionControl = {
	/** The BEM block, as in `rcx-check-box`. */
	name: string;
	/** The prefix of the constants of its frames, as in `checkBox`. */
	prefix: string;
	unchecked: 'empty' | 'off';
	/** The input pseudo-classes that draw the primary palette. */
	checked: string[];
	radius: string;
	/** Lifts the focused fake so its ring isn't clipped by a sibling. */
	focusRaised?: boolean;
	/** What the fake adds to the layout the three controls share. */
	fake: Record<string, Value>;
};

const frameConstant = (name: string, style: Record<string, Value>) => `const ${name} = ${literal(style)} as const;`;

/**
 * The layout of the three frames of a selection control: the label, the visually hidden input and the fake that stands in for
 * it. The fake sets no colour: every one of them, the resting state included, comes from `selectionStates`.
 */
export const selectionFrames = ({ prefix, radius, fake }: SelectionControl) => {
	const label = {
		render: 'label',
		flexDirection: 'row',
		flexShrink: 1,
		alignItems: 'normal',
		minWidth: 'auto',
		minHeight: 'auto',
		position: 'relative',
		display: 'inline-flex',
		verticalAlign: 'middle',
		cursor: 'pointer',
		outlineWidth: 0,
	};

	return [
		frameConstant(`${prefix}Label`, { ...textFrameDefaults(label), ...label }),
		frameConstant(`${prefix}Input`, {
			render: 'input',
			flexDirection: 'row',
			flexShrink: 1,
			alignItems: 'normal',
			minWidth: 'auto',
			minHeight: 'auto',
			position: 'absolute',
			display: 'block',
			overflow: 'hidden',
			clipPath: 'inset(50%)',
			width: '1px',
			height: '1px',
			padding: 0,
			whiteSpace: 'nowrap',
			borderWidth: 0,
		}),
		frameConstant(`${prefix}Fake`, {
			render: 'i',
			flexDirection: 'row',
			flexShrink: 1,
			alignItems: 'normal',
			minWidth: 'auto',
			minHeight: 'auto',
			position: 'relative',
			height: size('x20')!,
			borderWidth: borderWidth('default'),
			borderRadius: radius,
			...fake,
		}),
	].join('\n\n');
};

/** The CSS that follows a hidden input's pseudo-classes: every colour of the fake, from resting to disabled. */
export const selectionStates = ({ name, unchecked, checked, focusRaised }: SelectionControl) => {
	const palettes = selectionColors();
	const shadow = toCSSValue('--rcx-input-colors-focus-shadow-color', shadowColors['shadow-highlight'].toString());
	const focusShadow = `0 0 0 ${borderWidth('medium')} ${shadow}`;
	const selectors = (inputs: string[], state: string) =>
		inputs.map((input) => `.rcx-${name}__input${input}${state} + .rcx-${name}__fake`).join(',\n');

	const rules = (inputs: string[], palette: Palette, raised = false) => [
		`${selectors(inputs, '')} {\n\tcolor: ${palette.color};\n\tborder-color: ${palette.border};\n\tbackground-color: ${palette.background};\n}`,
		...(['hover', 'active'] as const).map(
			(state) =>
				`${selectors(inputs, `:${state}`)} {\n\tborder-color: ${palette[state].border};\n\tbackground-color: ${palette[state].background};\n\tbox-shadow: none;\n}`,
		),
		`${selectors(inputs, ':focus')} {${raised ? `\n\tz-index: ${zIndex.raised};\n` : ''}\n\tborder-color: ${palette.focus.border};\n\tbackground-color: ${palette.focus.background};\n\tbox-shadow: ${focusShadow};\n}`,
		`${selectors(inputs, ':disabled')} {\n\tcursor: not-allowed;\n\n\tcolor: ${palette.disabled.color};\n\tborder-color: ${palette.disabled.border};\n\tbackground-color: ${palette.disabled.background};\n}`,
	];

	return [...rules([''], palettes[unchecked], focusRaised), ...rules(checked, palettes.primary)].join('\n\n');
};
