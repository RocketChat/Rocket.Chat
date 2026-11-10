import breakpointTokens from '@rocket.chat/fuselage-tokens/dist/breakpoints.json';
import type { Preview } from '@storybook/react';
import { useLayoutEffect, useSyncExternalStore } from 'react';

import { PaletteStyleTag } from '../src';
import DocsContainer from './DocsContainer';
import { globalTypes, initialGlobals } from './globals';
import { resolveThemeMode, subscribeToSystemColorScheme } from './theme';

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
	},
	globalTypes,
	initialGlobals,
	// Stories that place elements by their measured size, like tooltips, must be measured in the final fonts,
	// or the visual regression snapshots render where the fallback font left them.
	loaders: [() => Promise.all([...document.fonts].map((font) => font.load()))],
	decorators: [
		function PaletteDecorator(Story, { globals }) {
			// Only the rtl global touches `dir`, so a story that sets its own direction keeps it
			useLayoutEffect(() => {
				if (globals.direction !== 'rtl') {
					return;
				}
				const root = document.documentElement;
				const previous = root.getAttribute('dir');
				root.dir = 'rtl';
				return () => {
					if (previous === null) {
						root.removeAttribute('dir');
					} else {
						root.dir = previous;
					}
				};
			}, [globals.direction]);

			const mode = useSyncExternalStore(subscribeToSystemColorScheme, () => resolveThemeMode(globals.theme));

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
	],
	tags: ['autodocs'],
} satisfies Preview;
