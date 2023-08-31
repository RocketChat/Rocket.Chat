import type { FontSize } from '@rocket.chat/rest-typings';
import { useUserPreference } from '@rocket.chat/ui-contexts';
import type { ThemePreference } from '@rocket.chat/ui-theming/src/types/themes';

export type AccessibilityPreferencesData = {
	themeAppearence?: ThemePreference;
	fontSize?: FontSize;
	fontSizePreference?: FontSize;
	clockMode?: 0 | 1 | 2;
	hideUsernames?: boolean;
	hideRoles?: boolean;
};

export const useAccessiblityPreferencesValues = (): AccessibilityPreferencesData => {
	const themeAppearence = useUserPreference<ThemePreference>('themeAppearence') || 'auto';
	const fontSize = useUserPreference<FontSize>('fontSize') || '100%';
	const clockMode = useUserPreference<0 | 1 | 2>('clockMode') ?? 0;
	const hideUsernames = useUserPreference<boolean>('hideUsernames');
	const hideRoles = useUserPreference<boolean>('hideRoles');

	return {
		themeAppearence,
		fontSize,
		clockMode,
		hideUsernames,
		hideRoles,
	};
};
