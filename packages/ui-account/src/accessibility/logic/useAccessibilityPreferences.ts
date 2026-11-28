import type { ThemePreference } from '@rocket.chat/core-typings';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { FontSize } from '@rocket.chat/rest-typings';
import { useEndpoint, useSetting, useToastMessageDispatch, useUserPreference } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

export type AccessibilityPreferencesData = {
	themeAppearence?: ThemePreference;
	fontSize?: FontSize;
	fontSizePreference?: FontSize;
	mentionsWithSymbol?: boolean;
	clockMode?: 0 | 1 | 2;
	hideUsernames?: boolean;
	hideRoles?: boolean;
};

export type AccessibilityPreferencesViewModel = {
	values: AccessibilityPreferencesData;
	displayRolesEnabled: boolean;
	save: (changes: Partial<AccessibilityPreferencesData>) => Promise<void>;
};

const useAccessibilityPreferencesValues = (): AccessibilityPreferencesData => {
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

export const useAccessibilityPreferences = (): AccessibilityPreferencesViewModel => {
	const { t } = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const values = useAccessibilityPreferencesValues();
	const displayRolesEnabled = useSetting('UI_DisplayRoles', false);
	const setUserPreferences = useEndpoint('POST', '/v1/users.setPreferences');

	const save = useStableCallback(async (changes: Partial<AccessibilityPreferencesData>) => {
		try {
			await setUserPreferences({ data: changes });
			dispatchToastMessage({ type: 'success', message: t('Preferences_saved') });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});

	return { values, displayRolesEnabled, save };
};
