import { PaletteStyleTag } from '@rocket.chat/fuselage';
import type { Parameters, Decorator } from '@storybook/react';
import { useSyncExternalStore } from 'react';

import DocsContainer from './DocsContainer.js';
import { resolveThemeMode, subscribeToSystemColorScheme, type ThemeMode } from './theme.js';

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
};

/** The Fuselage palette in effect for the theme global, kept in sync with the OS color scheme when it is set to match the system. */
export const useThemeMode = (themeGlobal: unknown): ThemeMode =>
	useSyncExternalStore(subscribeToSystemColorScheme, () => resolveThemeMode(themeGlobal));

export const decorators: Decorator[] = [
	function PaletteDecorator(Story, { globals }) {
		const mode = useThemeMode(globals.theme);

		return (
			<>
				<style>{`
					body {
						background-color: var(--rcx-color-surface-light);
					}
				`}</style>
				<PaletteStyleTag theme={mode} />
				<Story />
			</>
		);
	},
];
