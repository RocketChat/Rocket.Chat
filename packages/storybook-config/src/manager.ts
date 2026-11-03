import { createElement } from 'react';
import type { API_HashEntry } from 'storybook/internal/types';
import { addons } from 'storybook/manager-api';

import logo from './logo.svg';
import { applyComponentStatusColors, componentStatuses, findComponentStatus, getComponentStatusBadgeStyle } from './status.js';
import { createBrandTitle, readThemeGlobalFromUrl, resolveThemeMode, subscribeToThemeMode, themes, type ThemeMode } from './theme.js';

const createManagerTheme = (mode: ThemeMode) => ({
	...themes[mode],
	brandTitle: createBrandTitle(mode, { logo, name: process.env.STORYBOOK_PACKAGE_NAME }),
});

/** Labels a component in the sidebar with its lifecycle status, when it has one. */
const renderLabel = (item: API_HashEntry) => {
	const componentStatus = item.type === 'component' ? findComponentStatus(item.tags) : undefined;

	if (!componentStatus) {
		return item.name;
	}

	const { label, description } = componentStatuses[componentStatus];

	return createElement(
		'span',
		{ style: { display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'space-between', gap: 8 } },
		createElement('span', null, item.name),
		createElement('span', { style: getComponentStatusBadgeStyle(componentStatus), title: description }, label),
	);
};

const initialMode = resolveThemeMode(readThemeGlobalFromUrl());

applyComponentStatusColors(document.documentElement, initialMode);

addons.setConfig({ theme: createManagerTheme(initialMode), sidebar: { renderLabel } });

addons.register('rocket.chat/fuselage-theme', (api) => {
	subscribeToThemeMode(api, readThemeGlobalFromUrl(), (mode) => {
		applyComponentStatusColors(document.documentElement, mode);
		api.setOptions({ theme: createManagerTheme(mode) });
	});
});
