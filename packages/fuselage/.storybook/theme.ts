// Keep in step with ../../storybook-config/src/theme.ts, which Fuselage can't import: storybook-config depends on Fuselage.
import border from '@rocket.chat/fuselage-tokens/dist/border.json';
import button from '@rocket.chat/fuselage-tokens/dist/button.json';
import font from '@rocket.chat/fuselage-tokens/dist/font.json';
import stroke from '@rocket.chat/fuselage-tokens/dist/stroke.json';
import surface from '@rocket.chat/fuselage-tokens/dist/surface.json';
import typography from '@rocket.chat/fuselage-tokens/dist/typography.json';
import { GLOBALS_UPDATED, SET_GLOBALS } from 'storybook/internal/core-events';
import type { ThemeVars } from 'storybook/theming';
import { create } from 'storybook/theming';

export type ThemeMode = 'light' | 'dark' | 'high-contrast';

export type ThemeGlobal = ThemeMode | 'system';

const fontStack = (families: readonly string[]) => families.map((family) => (family.includes(' ') ? `"${family}"` : family)).join(', ');

/** Builds a Storybook theme that dresses the manager and docs in Fuselage's palette, type and radii. */
const createFuselageTheme = (mode: ThemeMode): ThemeVars =>
	create({
		base: mode === 'dark' ? 'dark' : 'light',

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

export const themes: Record<ThemeMode, ThemeVars> = {
	'light': createFuselageTheme('light'),
	'dark': createFuselageTheme('dark'),
	'high-contrast': createFuselageTheme('high-contrast'),
};

/** Brands the sidebar header with the logo and the name of the package the Storybook documents. */
export const createBrandTitle = (mode: ThemeMode, { logo, name }: { logo: string; name?: string }): string => `
	<span style="display: flex; flex-direction: column; gap: 4px;">
		<img src="${logo.replaceAll('"', '%22')}" alt="Rocket.Chat" style="display: block; width: 128px; height: auto;" />
		${name ? `<span style="font-size: 12px; font-weight: 700; line-height: 16px; color: ${font[mode].hint};">${name}</span>` : ''}
	</span>
`;

const systemColorScheme = () => window.matchMedia('(prefers-color-scheme: dark)');

/** Picks the palette in effect for a theme global, deferring to the OS color scheme when it is set to match the system. */
export const resolveThemeMode = (global: unknown): ThemeMode => {
	if (global === 'light' || global === 'dark' || global === 'high-contrast') {
		return global;
	}

	return systemColorScheme().matches ? 'dark' : 'light';
};

/** Notifies when the OS color scheme changes. */
export const subscribeToSystemColorScheme = (callback: () => void): (() => void) => {
	const query = systemColorScheme();
	query.addEventListener('change', callback);
	return () => query.removeEventListener('change', callback);
};

/** Reads the theme global from the page URL, where Storybook keeps globals so that shared links reproduce them. */
export const readThemeGlobalFromUrl = (): string | undefined =>
	new URL(window.location.href).searchParams
		.get('globals')
		?.split(';')
		.map((entry) => entry.split(':'))
		.find(([key]) => key === 'theme')?.[1];

type Channel = {
	on(eventName: string, listener: (payload: { globals?: Record<string, unknown> }) => void): void;
	off(eventName: string, listener: (payload: { globals?: Record<string, unknown> }) => void): void;
};

/** Follows the palette in effect as the theme global and the OS color scheme change. */
export const subscribeToThemeMode = (channel: Channel, initialGlobal: unknown, callback: (mode: ThemeMode) => void): (() => void) => {
	let global = initialGlobal;

	const notify = () => callback(resolveThemeMode(global));

	const handleGlobals = ({ globals }: { globals?: Record<string, unknown> }) => {
		if (!globals || !('theme' in globals)) {
			return;
		}

		global = globals.theme;
		notify();
	};

	notify();
	channel.on(SET_GLOBALS, handleGlobals);
	channel.on(GLOBALS_UPDATED, handleGlobals);
	const unsubscribeFromSystem = subscribeToSystemColorScheme(notify);

	return () => {
		channel.off(SET_GLOBALS, handleGlobals);
		channel.off(GLOBALS_UPDATED, handleGlobals);
		unsubscribeFromSystem();
	};
};
