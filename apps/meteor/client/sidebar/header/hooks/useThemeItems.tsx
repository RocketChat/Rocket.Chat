import { RadioButton } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import { useThemeMode } from '@rocket.chat/ui-theming/src/hooks/useThemeMode';
import React from 'react';

import type { GenericMenuItemProps } from '../../../components/GenericMenu/GenericMenuItem';

export const useThemeItems = (): GenericMenuItemProps[] => {
	const t = useTranslation();

	const [selectedTheme, setTheme] = useThemeMode();

	return [
		{
			id: 'light',
			icon: 'sun',
			content: t('Theme_light'),
			addon: <RadioButton checked={selectedTheme === 'light'} onChange={setTheme('light')} m='x4' />,
		},
		{
			id: 'dark',
			icon: 'moon',
			content: t('Theme_dark'),
			addon: <RadioButton checked={selectedTheme === 'dark'} onChange={setTheme('dark')} m='x4' />,
		},
		{
			id: 'auto',
			icon: 'desktop',
			content: t('Theme_match_system'),
			addon: <RadioButton checked={selectedTheme === 'auto'} onChange={setTheme('auto')} m='x4' />,
		},
	];
};
