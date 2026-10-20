import buttonTokens from '@rocket.chat/fuselage-tokens/dist/button.json';
import colors from '@rocket.chat/fuselage-tokens/dist/colors.json';

import { shadowColors, statusColors, strokeColors } from '../../Theme';
import { toCSSColorValue, toCSSValue } from '../../helpers/toCSSValue';
import { borderRadius, borderWidth } from '../../styleTokens';

const tokens: Record<string, string> = buttonTokens.light;

type State = 'default' | 'hover' | 'press' | 'focus' | 'disabled';

// fuselage-tokens has no warning, secondary-warning or secondary-success groups yet, so these take primitives
const primitiveBackgrounds: Record<string, Record<State, string>> = {
	'warning': { default: colors.y400, hover: colors.y500, press: colors.y600, focus: colors.y400, disabled: colors.y200 },
	'secondary-warning': { default: colors.n400, hover: colors.n500, press: colors.n600, focus: colors.n400, disabled: colors.n300 },
	'secondary-success': { default: colors.n400, hover: colors.n500, press: colors.n600, focus: colors.n400, disabled: colors.n300 },
};

const primitiveFonts: Record<string, string> = {
	'warning': colors.n900,
	'warning-disabled': colors.n600,
	'secondary-warning': colors.y900,
	'secondary-warning-disabled': colors.y600,
	'secondary-success': colors.g800,
	'secondary-success-disabled': colors.g400,
};

const camelCase = (name: string) => name.replace(/-(\w)/g, (_, letter: string) => letter.toUpperCase());

export const buttonBackground = (kind: string, state: State) =>
	toCSSColorValue(
		`button-background-${kind}-${state}`,
		primitiveBackgrounds[kind]?.[state] ?? tokens[camelCase(`background-${kind}-${state}`)],
	);

export const buttonFont = (name: string) =>
	toCSSColorValue(
		`button-font-on-${name}`,
		primitiveFonts[name] ?? tokens[camelCase(`font-on-${name}`)] ?? tokens[camelCase(`on-${name}`)],
	);

export const buttonBorderWidth = toCSSValue('--rcx-button-border-width', borderWidth('default')!);

export const buttonBorderRadius = toCSSValue(
	'--rcx-button-border-radius',
	toCSSValue('--rcx-border-radius-medium', borderRadius('medium')!),
);

export type ButtonColors = {
	color: string;
	backgroundColor: string;
	borderColor: string;
	hoverBackgroundColor: string;
	hoverBorderColor: string;
	activeBackgroundColor: string;
	activeBorderColor: string;
	focusBackgroundColor: string;
	focusBorderColor: string;
	focusShadowColor: string;
	disabledBackgroundColor: string;
	disabledBorderColor: string;
	disabledColor: string;
	pressedBackgroundColor?: string;
	pressedBorderColor?: string;
};

const kindColors = (kind: string, focusShadowColor: string): ButtonColors => {
	const themed = (name: string, value: string) => toCSSValue(`--rcx-button-${kind}-${name}`, value);

	return {
		color: themed('color', buttonFont(kind)),
		backgroundColor: themed('background-color', buttonBackground(kind, 'default')),
		borderColor: themed('border-color', buttonBackground(kind, 'default')),
		hoverBackgroundColor: themed('hover-background-color', buttonBackground(kind, 'hover')),
		hoverBorderColor: themed('hover-border-color', buttonBackground(kind, 'hover')),
		activeBackgroundColor: themed('active-background-color', buttonBackground(kind, 'press')),
		activeBorderColor: themed('active-border-color', buttonBackground(kind, 'press')),
		focusBackgroundColor: themed('focus-background-color', buttonBackground(kind, 'focus')),
		focusBorderColor: themed('focus-border-color', strokeColors['stroke-extra-dark'].toString()),
		focusShadowColor: themed('focus-shadow-color', focusShadowColor),
		disabledBackgroundColor: themed('disabled-background-color', buttonBackground(kind, 'disabled')),
		disabledBorderColor: themed('disabled-border-color', buttonBackground(kind, 'disabled')),
		disabledColor: themed('disabled-color', buttonFont(`${kind}-disabled`)),
	};
};

const highlightShadow = shadowColors['shadow-highlight'].toString();
// no semantic token for it yet
const errorShadow = toCSSColorValue('shadow-extra-light-error', colors.r200);
const lightStroke = strokeColors['stroke-light'].toString();

const primary = kindColors('primary', highlightShadow);
const secondary = kindColors('secondary', highlightShadow);
const danger = kindColors('danger', errorShadow);
const warning = kindColors('warning', lightStroke);
const success = kindColors('success', lightStroke);

const iconColors = (
	kind: string,
	color: string,
	{ focusShadowColor, disabledColor, activeBorderColor }: { focusShadowColor: string; disabledColor: string; activeBorderColor: string },
): ButtonColors => {
	const themed = (name: string, value: string) => toCSSColorValue(`button-${kind}-${name}`, value);

	return {
		color: themed('color', color),
		backgroundColor: themed('background-color', 'transparent'),
		borderColor: themed('border-color', 'transparent'),
		hoverBackgroundColor: themed('hover-background-color', secondary.hoverBackgroundColor),
		hoverBorderColor: themed('hover-border-color', secondary.hoverBorderColor),
		activeBackgroundColor: themed('active-background-color', secondary.activeBackgroundColor),
		activeBorderColor: themed('active-border-color', activeBorderColor),
		focusBackgroundColor: themed('focus-background-color', secondary.focusBackgroundColor),
		focusBorderColor: themed('focus-border-color', secondary.focusBorderColor),
		focusShadowColor: themed('focus-shadow-color', focusShadowColor),
		disabledBackgroundColor: toCSSColorValue('button-icon-disabled-background-color', 'transparent'),
		disabledBorderColor: toCSSColorValue('button-icon-disabled-border-color', 'transparent'),
		disabledColor: themed('disabled-color', disabledColor),
		pressedBackgroundColor: themed('pressed-background-color', secondary.activeBackgroundColor),
		pressedBorderColor: themed('pressed-border-color', activeBorderColor),
	};
};

/** The colors of every `rcx-button--<kind>`, each overridable through its `--rcx-button-…` and `--rcx-color-button-…` properties. */
export const buttonColors = {
	primary,
	secondary,
	danger,
	'secondary-danger': kindColors('secondary-danger', errorShadow),
	warning,
	'secondary-warning': kindColors('secondary-warning', lightStroke),
	success,
	'secondary-success': kindColors('secondary-success', lightStroke),
	'icon': iconColors('icon', secondary.color, {
		focusShadowColor: secondary.focusShadowColor,
		disabledColor: secondary.disabledColor,
		activeBorderColor: secondary.activeBorderColor,
	}),
	'icon-info': iconColors('icon-info', statusColors['status-font-on-info'].toString(), {
		focusShadowColor: secondary.focusShadowColor,
		disabledColor: primary.disabledBackgroundColor,
		activeBorderColor: secondary.activeBackgroundColor,
	}),
	'icon-success': iconColors('icon-success', statusColors['status-font-on-success'].toString(), {
		focusShadowColor: success.focusShadowColor,
		disabledColor: success.disabledBackgroundColor,
		activeBorderColor: secondary.activeBorderColor,
	}),
	'icon-warning': iconColors('icon-warning', statusColors['status-font-on-warning'].toString(), {
		focusShadowColor: warning.focusShadowColor,
		disabledColor: warning.disabledBackgroundColor,
		activeBorderColor: secondary.activeBorderColor,
	}),
	'icon-danger': iconColors('icon-danger', statusColors['status-font-on-danger'].toString(), {
		focusShadowColor: danger.focusShadowColor,
		disabledColor: danger.disabledBackgroundColor,
		activeBorderColor: secondary.activeBorderColor,
	}),
};

export type ButtonKind = keyof typeof buttonColors;

const translucent = (kind: string, state: State) => `color-mix(in srgb, ${buttonBackground(kind, state)} 70%, transparent)`;

const ghostColors = (kind: 'secondary' | 'danger' | 'warning' | 'success' | 'primary') => {
	const infix = kind === 'secondary' ? '' : `${kind}-`;

	return {
		groupBackgroundColor: toCSSValue(`--rcx-split-button-${infix}background-color`, translucent(kind, 'default')),
		color: kind === 'secondary' ? buttonFont('secondary') : toCSSValue(`--rcx-split-button-${kind}-color`, buttonFont(kind)),
		hoverBackgroundColor: toCSSValue(`--rcx-button-ghost-${infix}hover-background-color`, translucent(kind, 'hover')),
		activeBackgroundColor: toCSSValue(`--rcx-button-ghost-${infix}active-background-color`, translucent(kind, 'press')),
		focusBackgroundColor: toCSSValue(`--rcx-button-ghost-${infix}focus-background-color`, translucent(kind, 'focus')),
	};
};

/** The colors of a `SplitButton`'s ghost segment, which its translucent group background shows through, by the group variant. */
export const ghostButtonColors = {
	secondary: ghostColors('secondary'),
	danger: ghostColors('danger'),
	warning: ghostColors('warning'),
	success: ghostColors('success'),
	primary: ghostColors('primary'),
};

export type GhostKind = keyof typeof ghostButtonColors;
