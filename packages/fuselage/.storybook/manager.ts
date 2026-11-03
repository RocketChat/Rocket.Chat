import { addons } from 'storybook/manager-api';

import manifest from '../package.json';
import logo from './logo.svg';
import { createBrandTitle, readThemeGlobalFromUrl, resolveThemeMode, subscribeToThemeMode, themes, type ThemeMode } from './theme';

const createManagerTheme = (mode: ThemeMode) => ({
	...themes[mode],
	brandTitle: createBrandTitle(mode, { logo, name: manifest.name }),
	brandUrl: manifest.homepage,
});

addons.setConfig({ theme: createManagerTheme(resolveThemeMode(readThemeGlobalFromUrl())) });

addons.register('rocket.chat/fuselage-theme', (api) => {
	subscribeToThemeMode(api, readThemeGlobalFromUrl(), (mode) => {
		api.setOptions({ theme: createManagerTheme(mode) });
	});
});
