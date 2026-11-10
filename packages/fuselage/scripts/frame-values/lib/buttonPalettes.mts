import { buttonTokens, camelCase, colors } from './tokens.mts';
import { shadowColors, statusColors, strokeColors } from '../../../src/Theme.ts';
import { toCSSColorValue, toCSSValue } from '../../../src/helpers/toCSSValue.ts';

// button.json has no warning, secondary-warning or secondary-success groups yet, so these take primitives
const primitiveBackgrounds: Record<string, Record<string, string>> = {
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

export const buttonBackground = (kind: string, state: string) =>
	toCSSColorValue(
		`button-background-${kind}-${state}`,
		primitiveBackgrounds[kind]?.[state] ?? buttonTokens.light[camelCase(`background-${kind}-${state}`)],
	);

// `button.json` names its disabled font on secondary-danger without the `font`
export const buttonFont = (name: string) =>
	toCSSColorValue(
		`button-font-on-${name}`,
		primitiveFonts[name] ?? buttonTokens.light[camelCase(`font-on-${name}`)] ?? buttonTokens.light[camelCase(`on-${name}`)],
	);

const highlightShadow = shadowColors['shadow-highlight'].toString();
const errorShadow = toCSSColorValue('shadow-extra-light-error', colors.r200);
const lightStroke = strokeColors['stroke-light'].toString();

/** Each Button kind with the colour of its focus ring. */
export const kinds = {
	'primary': highlightShadow,
	'secondary': highlightShadow,
	'danger': errorShadow,
	'secondary-danger': errorShadow,
	'warning': lightStroke,
	'secondary-warning': lightStroke,
	'success': lightStroke,
	'secondary-success': lightStroke,
};

/** Every colour of a kind is its own `--rcx-button-<kind>-…` property over the palette's `--rcx-color-button-…` one. */
export const kindColors = (kind: string, shadow: string) => {
	const themed = (name: string, value: string) => toCSSValue(`--rcx-button-${kind}-${name}`, value);

	return {
		color: themed('color', buttonFont(kind)),
		background: themed('background-color', buttonBackground(kind, 'default')),
		border: themed('border-color', buttonBackground(kind, 'default')),
		hoverBackground: themed('hover-background-color', buttonBackground(kind, 'hover')),
		hoverBorder: themed('hover-border-color', buttonBackground(kind, 'hover')),
		activeBackground: themed('active-background-color', buttonBackground(kind, 'press')),
		activeBorder: themed('active-border-color', buttonBackground(kind, 'press')),
		focusBackground: themed('focus-background-color', buttonBackground(kind, 'focus')),
		focusBorder: themed('focus-border-color', strokeColors['stroke-extra-dark'].toString()),
		focusShadow: themed('focus-shadow-color', shadow),
		disabledBackground: themed('disabled-background-color', buttonBackground(kind, 'disabled')),
		disabledBorder: themed('disabled-border-color', buttonBackground(kind, 'disabled')),
		disabledColor: themed('disabled-color', buttonFont(`${kind}-disabled`)),
	};
};

/** The IconButton palettes: the plain icon and the four status ones, over the secondary Button's states. */
export const iconPalettes = () => {
	const secondary = kindColors('secondary', kinds.secondary);
	const statusFont = (name: string) => statusColors[`status-font-on-${name}` as keyof typeof statusColors].toString();

	const palette = (
		kind: string,
		own: { color: string; activeBorder: string; pressedBorder: string; focusShadow: string; disabledColor: string },
	) => {
		const themed = (name: string, value: string) => toCSSColorValue(`button-${kind}-${name}`, value);
		const iconThemed = (name: string, value: string) => toCSSColorValue(`button-icon-${name}`, value);

		return {
			colors: {
				color: themed('color', own.color),
				background: themed('background-color', 'transparent'),
				border: themed('border-color', 'transparent'),
				hoverBackground: themed('hover-background-color', secondary.hoverBackground),
				hoverBorder: themed('hover-border-color', secondary.hoverBorder),
				activeBackground: themed('active-background-color', secondary.activeBackground),
				activeBorder: themed('active-border-color', own.activeBorder),
				focusBackground: themed('focus-background-color', secondary.focusBackground),
				focusBorder: themed('focus-border-color', secondary.focusBorder),
				focusShadow: themed('focus-shadow-color', own.focusShadow),
				disabledBackground: iconThemed('disabled-background-color', 'transparent'),
				disabledBorder: iconThemed('disabled-border-color', 'transparent'),
				disabledColor: themed('disabled-color', own.disabledColor),
			},
			pressedBackground: themed('pressed-background-color', secondary.activeBackground),
			pressedBorder: themed('pressed-border-color', own.pressedBorder),
		};
	};

	// info presses and activates over the secondary background; the others over its border
	const statusPalette = (name: string, owner: ReturnType<typeof kindColors>) => {
		const border = name === 'info' ? secondary.activeBackground : secondary.activeBorder;

		return palette(name, {
			color: statusFont(name),
			activeBorder: border,
			pressedBorder: border,
			focusShadow: name === 'info' ? secondary.focusShadow : owner.focusShadow,
			disabledColor: owner.disabledBackground,
		});
	};

	return {
		icon: palette('icon', {
			color: secondary.color,
			activeBorder: secondary.activeBorder,
			pressedBorder: secondary.activeBorder,
			focusShadow: secondary.focusShadow,
			disabledColor: secondary.disabledColor,
		}),
		info: statusPalette('info', kindColors('primary', kinds.primary)),
		success: statusPalette('success', kindColors('success', kinds.success)),
		warning: statusPalette('warning', kindColors('warning', kinds.warning)),
		danger: statusPalette('danger', kindColors('danger', kinds.danger)),
	};
};
