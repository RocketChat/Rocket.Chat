// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as React from 'react';
import { Addon_TypesEnum } from 'storybook/internal/types';
import { addons } from 'storybook/manager-api';
import { themes } from 'storybook/theming';

import Tool, { prefersDark, store } from '../Tool';

const currentStore = store();
const currentTheme = currentStore.current || (prefersDark.matches && 'dark') || 'light';

addons.setConfig({
	theme: {
		...themes[currentTheme],
		...currentStore[currentTheme],
	},
});

addons.register('storybook/dark-mode', (api) => {
	addons.add('storybook/dark-mode', {
		title: 'dark mode',
		type: Addon_TypesEnum.TOOL,
		match: ({ viewMode }) => viewMode === 'story' || viewMode === 'docs',
		render: () => <Tool api={api} />,
	});
});
