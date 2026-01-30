import type { ThemePreference } from '@rocket.chat/core-typings';
import type { FontSize } from '@rocket.chat/rest-typings';
import { useUserPreference } from '@rocket.chat/ui-contexts';

export type AccessibilityPreferencesData = {
	themeAppearence?: ThemePreference;
	fontSize?: FontSize;
	fontSizePreference?: FontSize;
	mentionsWithSymbol?: boolean;
	clockMode?: 0 | 1 | 2;
	hideUsernames?: boolean;
	hideRoles?: boolean;
};

export const useAccessiblityPreferencesValues = (): AccessibilityPreferencesData => {
	const themeAppearence = useUserPreference<ThemePreference>('themeAppearence') || 'auto';
	const fontSize = useUserPreference<FontSize>('fontSize') || '100%';
	const mentionsWithSymbol = useUserPreference<boolean>('mentionsWithSymbol') || false;
	const clockMode = useUserPreference<0 | 1 | 2>('clockMode') ?? 0;
	const hideUsernames = useUserPreference<boolean>('hideUsernames');
	const hideRoles = useUserPreference<boolean>('hideRoles');

	return {
		themeAppearence,
		fontSize,
		mentionsWithSymbol,
		clockMode,
		hideUsernames,
		hideRoles,
	};
};
