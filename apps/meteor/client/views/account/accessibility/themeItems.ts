import type { TranslationKey } from '@rocket.chat/ui-contexts';

type ThemeItem = {
	id: string;
	title: TranslationKey;
	description: TranslationKey;
};
export const themeItems: ThemeItem[] = [
	{
		id: 'light',
		title: 'Theme_light',
		description: 'Theme_light_description',
	},
	{
		id: 'dark',
		title: 'Theme_dark',
		description: 'Theme_dark_description',
	},
	{
		id: 'high-contrast',
		title: 'Theme_high_contrast',
		description: 'Theme_high_contrast_description',
	},
	{
		id: 'auto',
		title: 'Theme_match_system',
		description: 'Theme_match_system_description',
	},
];
