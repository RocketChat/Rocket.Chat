import breakpointTokens from '@rocket.chat/fuselage-tokens/dist/breakpoints.json';
import type { Preview } from '@storybook/react';
import { useLayoutEffect, useSyncExternalStore } from 'react';

import { PaletteStyleTag } from '../src';
import DocsContainer from './DocsContainer';
import { globalTypes, initialGlobals } from './globals';
import { resolveThemeMode, subscribeToSystemColorScheme } from './theme';

import 'normalize.css/normalize.css';
import '@rocket.chat/icons/dist/rocketchat.css';

// A Docs page mounts several stories at once, so the document's direction is held while any RTL story is mounted
let rtlStories = 0;
let dirBeforeRtl: string | null = null;

const holdRtl = () => {
	const root = document.documentElement;
	if (rtlStories++ === 0) {
		dirBeforeRtl = root.getAttribute('dir');
		root.dir = 'rtl';
	}
	return () => {
		if (--rtlStories > 0) return;
		if (dirBeforeRtl === null) {
			root.removeAttribute('dir');
		} else {
			root.dir = dirBeforeRtl;
		}
	};
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
	loaders: [() => import('fuselage-tamagui-config'), () => Promise.all([...document.fonts].map((font) => font.load()))],
	decorators: [
		function PaletteDecorator(Story, { globals }) {
			// Only the rtl global touches `dir`, so a story that sets its own direction keeps it
			useLayoutEffect(() => (globals.direction === 'rtl' ? holdRtl() : undefined), [globals.direction]);

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
