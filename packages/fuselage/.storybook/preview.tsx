import breakpointTokens from '@rocket.chat/fuselage-tokens/dist/breakpoints.json';
import surface from '@rocket.chat/fuselage-tokens/dist/surface.json';
import { useDarkMode } from '@rocket.chat/storybook-dark-mode';
import type { Preview } from '@storybook/react-webpack5';
import { themes } from 'storybook/theming';

import manifest from '../package.json';
import { PaletteStyleTag } from '../src';
import DocsContainer from './DocsContainer';
import logo from './logo.svg';

import 'normalize.css/normalize.css';
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
				order: ['Inputs', 'Data Display', 'Feedback', 'Containers', 'Navigation', 'Layout', 'Message', 'Sidebar'],
			},
		},
		viewport: {
			viewports: Object.fromEntries(
				Object.entries(breakpointTokens)
					.filter(([, { minViewportWidth }]) => minViewportWidth != null)
					.map(([name, { minViewportWidth }]) => [
						name,
						{
							name,
							styles: {
								width: `${minViewportWidth}px`,
								height: '90%',
							},
							type: 'desktop',
						},
					]),
			),
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
	// Stories that place elements by their measured size, like tooltips, must be measured in the final fonts,
	// or the visual regression snapshots render where the fallback font left them.
	loaders: [() => Promise.all([...document.fonts].map((font) => font.load()))],
	decorators: [
		(Story) => {
			const dark = useDarkMode();

			return (
				<>
					<PaletteStyleTag theme={dark ? 'dark' : 'light'} />
					<Story />
				</>
			);
		},
	],
	tags: ['autodocs'],
} satisfies Preview;
