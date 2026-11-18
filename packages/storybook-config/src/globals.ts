import type { ThemeGlobal } from './theme.js';

/** The toolbar control that picks which Fuselage palette stories, docs and the manager use. */
export const globalTypes = {
	theme: {
		name: 'Theme',
		description: 'Fuselage palette',
		toolbar: {
			title: 'Theme',
			icon: 'paintbrush',
			dynamicTitle: true,
			items: [
				{ value: 'system', title: 'Match system', icon: 'mirror' },
				{ value: 'light', title: 'Light', icon: 'sun' },
				{ value: 'dark', title: 'Dark', icon: 'moon' },
				{ value: 'high-contrast', title: 'High contrast', icon: 'contrast' },
			],
		},
	},
};

export const initialGlobals: { theme: ThemeGlobal } = {
	theme: 'system',
};
