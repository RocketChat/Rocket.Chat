import border from '@rocket.chat/fuselage-tokens/dist/border.json';
import button from '@rocket.chat/fuselage-tokens/dist/button.json';
import font from '@rocket.chat/fuselage-tokens/dist/font.json';
import stroke from '@rocket.chat/fuselage-tokens/dist/stroke.json';
import surface from '@rocket.chat/fuselage-tokens/dist/surface.json';
import typography from '@rocket.chat/fuselage-tokens/dist/typography.json';
import type { ThemeVars } from 'storybook/theming';
import { create } from 'storybook/theming';

const fontStack = (families: readonly string[]) => families.map((family) => (family.includes(' ') ? `"${family}"` : family)).join(', ');

type Mode = 'light' | 'dark';

/** Builds a Storybook theme that dresses the manager and docs in Fuselage's palette, type and radii. */
const createFuselageTheme = (mode: Mode): ThemeVars =>
	create({
		base: mode,

		colorPrimary: button[mode].backgroundPrimaryDefault,
		colorSecondary: stroke[mode].highlight,

		appBg: surface[mode].sidebar,
		appContentBg: surface[mode].light,
		appPreviewBg: 'transparent',
		appBorderColor: stroke[mode].extraLight,
		appBorderRadius: border.radius.medium,

		fontBase: fontStack(typography.fontFamily.sans),
		fontCode: fontStack(typography.fontFamily.mono),

		textColor: font[mode].default,
		textInverseColor: font[mode].white,
		textMutedColor: font[mode].hint,

		barBg: surface[mode].light,
		barTextColor: font[mode].secondaryInfo,
		barHoverColor: stroke[mode].highlight,
		barSelectedColor: stroke[mode].highlight,

		buttonBg: button[mode].backgroundSecondaryDefault,
		buttonBorder: stroke[mode].extraLight,

		booleanBg: surface[mode].neutral,
		booleanSelectedBg: surface[mode].light,

		inputBg: surface[mode].light,
		inputBorder: stroke[mode].light,
		inputTextColor: font[mode].default,
		inputBorderRadius: border.radius.medium,
	});

export const lightTheme = createFuselageTheme('light');

export const darkTheme = createFuselageTheme('dark');
