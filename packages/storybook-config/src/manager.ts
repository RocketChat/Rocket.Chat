import { addons } from 'storybook/manager-api';

import logo from './logo.svg';
import { createBrandTitle, readThemeGlobalFromUrl, resolveThemeMode, subscribeToThemeMode, themes, type ThemeMode } from './theme.js';

const createManagerTheme = (mode: ThemeMode) => ({
	...themes[mode],
	brandTitle: createBrandTitle(mode, { logo, name: process.env.STORYBOOK_PACKAGE_NAME }),
});

addons.setConfig({ theme: createManagerTheme(resolveThemeMode(readThemeGlobalFromUrl())) });

addons.register('rocket.chat/fuselage-theme', (api) => {
	subscribeToThemeMode(api, readThemeGlobalFromUrl(), (mode) => {
		api.setOptions({ theme: createManagerTheme(mode) });
	});
});
