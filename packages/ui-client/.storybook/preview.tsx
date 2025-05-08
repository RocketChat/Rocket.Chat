import { PaletteStyleTag } from '@rocket.chat/fuselage';
import surface from '@rocket.chat/fuselage-tokens/dist/surface.json';
import type { Decorator, Parameters } from '@storybook/react';
import { themes } from '@storybook/theming';
import { useDarkMode } from 'storybook-dark-mode';

import manifest from '../package.json';
import DocsContainer from './DocsContainer';
import logo from './logo.svg';
import '@rocket.chat/fuselage/dist/fuselage.css';
import '@rocket.chat/icons/dist/rocketchat.css';

export const parameters: Parameters = {
	backgrounds: {
		grid: {
			cellSize: 4,
			cellAmount: 4,
			opacity: 0.5,
		},
	},
	options: {
		storySort: {
			method: 'alphabetical',
		},
	},
	layout: 'fullscreen',
	docs: {
		container: DocsContainer,
	},
	darkMode: {
		dark: {
			...themes.dark,
			appBg: surface.surface.dark.sidebar,
			appContentBg: surface.surface.dark.light,
			appPreviewBg: 'transparent',
			barBg: surface.surface.dark.light,
			brandTitle: manifest.name,
			brandImage: logo,
		},
		light: {
			...themes.normal,
			appPreviewBg: 'transparent',
			brandTitle: manifest.name,
			brandImage: logo,
		},
	},
};

export const decorators: Decorator[] = [
	(Story) => {
		const dark = useDarkMode();

		return (
			<>
				<PaletteStyleTag theme={dark ? 'dark' : 'light'} />
				<Story />
			</>
		);
	},
];
export const tags = ['autodocs'];
