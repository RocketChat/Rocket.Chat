import { buttonBackground, buttonFont } from './buttonPalettes.mts';
import { strokeColors } from '../../../src/Theme.ts';
import { toCSSValue } from '../../../src/helpers/toCSSValue.ts';
import { backgroundColor, fontColor } from '../../../src/styleTokens.ts';

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
