import { PaletteStyleTag } from '@rocket.chat/fuselage';
import surface from '@rocket.chat/fuselage-tokens/dist/surface.json';
import { useDarkMode } from '@rocket.chat/storybook-dark-mode';
import type { Preview } from '@storybook/react-webpack5';
import { Suspense } from 'react';
import { themes } from 'storybook/theming';

import manifest from '../package.json';
import DocsContainer from './DocsContainer';
import logo from './logo.svg';
import DarkModeProvider from '../src/DarkModeProvider';

import '@rocket.chat/fuselage/dist/fuselage.css';
import '@rocket.chat/icons/dist/rocketchat.css';

export default {
	parameters: {
		backgrounds: {
			grid: {
				cellSize: 4,
				cellAmount: 4,
				opacity: 0.5,
			},
		},
		docs: {
			container: DocsContainer,
		},
		options: {
			storySort: {
				method: 'alphabetical',
			},
		},
		layout: 'fullscreen',
		darkMode: {
			dark: {
				...themes.dark,
				appBg: surface.dark.sidebar,
				appContentBg: surface.dark.light,
				appPreviewBg: 'transparent',
				barBg: surface.dark.light,
				brandTitle: manifest.name,
				brandImage: logo,
				brandUrl: manifest.homepage,
			},
			light: {
				...themes.normal,
				appPreviewBg: 'transparent',
				brandTitle: manifest.name,
				brandImage: logo,
				brandUrl: manifest.homepage,
			},
		},
	},
	decorators: [
		(Story) => {
			const dark = useDarkMode();

			return (
				<Suspense fallback={null}>
					<DarkModeProvider forcedDarkMode={dark}>
						<PaletteStyleTag theme={dark ? 'dark' : 'light'} />
						<Story />
					</DarkModeProvider>
				</Suspense>
			);
		},
	],

	tags: ['autodocs'],
} satisfies Preview;
