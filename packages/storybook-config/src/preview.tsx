import { PaletteStyleTag } from '@rocket.chat/fuselage';
import { useDarkMode } from '@rocket.chat/storybook-dark-mode';
import type { Parameters, Decorator } from '@storybook/react';

import DocsContainer from './DocsContainer';
import logo from './logo.svg';
import { createBrandTitle, darkTheme, lightTheme } from './theme';

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
			...darkTheme,
			brandTitle: createBrandTitle('dark', { logo, name: process.env.STORYBOOK_PACKAGE_NAME }),
		},
		light: {
			...lightTheme,
			brandTitle: createBrandTitle('light', { logo, name: process.env.STORYBOOK_PACKAGE_NAME }),
		},
	},
};

export const decorators: Decorator[] = [
	function DarkModeDecorator(Story) {
		const dark = useDarkMode();

		return (
			<>
				<style>{`
					body {
						background-color: var(--rcx-color-surface-light);
					}
				`}</style>
				<PaletteStyleTag theme={dark ? 'dark' : 'light'} />
				<Story />
			</>
		);
	},
];
