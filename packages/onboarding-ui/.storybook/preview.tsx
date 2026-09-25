import { PaletteStyleTag } from '@rocket.chat/fuselage';
import surface from '@rocket.chat/fuselage-tokens/dist/surface.json';
import { DarkModeProvider } from '@rocket.chat/layout';
import { useDarkMode } from '@rocket.chat/storybook-dark-mode';
import type { Preview } from '@storybook/react-webpack5';
import i18next from 'i18next';
import { Suspense } from 'react';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { themes } from 'storybook/theming';

import manifest from '../package.json';
import DocsContainer from './DocsContainer';
import logo from './logo.svg';

import '@rocket.chat/fuselage/dist/fuselage.css';
import '@rocket.chat/icons/dist/rocketchat.css';

const getI18n = () => {
	const i18n = i18next.createInstance().use(initReactI18next);

	import('../.i18n/en.i18n.json').then((translation) => {
		i18n.init({
			fallbackLng: 'en',
			debug: false,
			resources: {
				en: {
					translation,
				},
			},
		});
	});

	return i18n;
};

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
					<I18nextProvider i18n={getI18n()}>
						<DarkModeProvider.default forcedDarkMode={dark}>
							<PaletteStyleTag theme={dark ? 'dark' : 'light'} />
							<Story />
						</DarkModeProvider.default>
					</I18nextProvider>
				</Suspense>
			);
		},
	],
	tags: ['autodocs'],
} satisfies Preview;
