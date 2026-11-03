import breakpointTokens from '@rocket.chat/fuselage-tokens/dist/breakpoints.json';
import { useDarkMode } from '@rocket.chat/storybook-dark-mode';
import type { Preview } from '@storybook/react-webpack5';

import manifest from '../package.json';
import { PaletteStyleTag } from '../src';
import DocsContainer from './DocsContainer';
import logo from './logo.svg';
import { createBrandTitle, darkTheme, lightTheme } from './theme';

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
				Object.entries(breakpointTokens).map(([name, { minViewportWidth }]) => [
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
				...darkTheme,
				brandTitle: createBrandTitle('dark', { logo, name: manifest.name }),
				brandUrl: manifest.homepage,
			},
			light: {
				...lightTheme,
				brandTitle: createBrandTitle('light', { logo, name: manifest.name }),
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
	],
	tags: ['autodocs'],
} satisfies Preview;
