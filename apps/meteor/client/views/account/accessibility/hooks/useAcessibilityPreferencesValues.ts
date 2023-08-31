import type { FontSize } from '@rocket.chat/rest-typings';
import { useUserPreference } from '@rocket.chat/ui-contexts';
import type { ThemePreference } from '@rocket.chat/ui-theming/src/types/themes';

export type AccessibilityPreferencesData = {
	themeAppearence?: ThemePreference;
	fontSize?: FontSize;
	fontSizePreference?: FontSize;
	hideUsernames?: boolean;
	hideRoles?: boolean;
};

export const useAccessiblityPreferencesValues = (): AccessibilityPreferencesData => {
	const themeAppearence = useUserPreference<ThemePreference>('themeAppearence') || 'auto';
	const fontSize = useUserPreference<FontSize>('fontSize') || '100%';
	const hideUsernames = useUserPreference<boolean>('hideUsernames');
	const hideRoles = useUserPreference<boolean>('hideRoles');

	return {
		themeAppearence,
		fontSize,
		hideUsernames,
		hideRoles,
	};
};
