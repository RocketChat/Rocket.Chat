import { RadioButton, ToggleSwitch } from '@rocket.chat/fuselage';
import { useEndpoint, useUserPreference, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useCallback } from 'react';

import type { Item } from './useSortModeItems';

export const useViewModeItems = (): Item[] => {
	const t = useTranslation();

	const saveUserPreferences = useEndpoint('POST', '/v1/users.setPreferences');

	const useHandleChange = (value: 'medium' | 'extended' | 'condensed'): (() => void) =>
		useCallback(() => saveUserPreferences({ data: { sidebarViewMode: value } }), [value]);

	const sidebarViewMode = useUserPreference<'medium' | 'extended' | 'condensed'>('sidebarViewMode', 'extended');
	const sidebarDisplayAvatar = useUserPreference('sidebarDisplayAvatar', false);

	const setToExtended = useHandleChange('extended');
	const setToMedium = useHandleChange('medium');
	const setToCondensed = useHandleChange('condensed');

	const handleChangeSidebarDisplayAvatar = useCallback(
		() => saveUserPreferences({ data: { sidebarDisplayAvatar: !sidebarDisplayAvatar } }),
		[saveUserPreferences, sidebarDisplayAvatar],
	);

	return [
		{
			id: 'extended',
			name: t('Extended'),
			icon: 'extended-view',
			input: <RadioButton mi='x16' onChange={setToExtended} checked={sidebarViewMode === 'extended'} />,
		},
		{
			id: 'medium',
			name: t('Medium'),
			icon: 'medium-view',
			input: <RadioButton mi='x16' onChange={setToMedium} checked={sidebarViewMode === 'medium'} />,
		},
		{
			id: 'condensed',
			name: t('Condensed'),
			icon: 'condensed-view',
			input: <RadioButton mi='x16' onChange={setToCondensed} checked={sidebarViewMode === 'condensed'} />,
		},
		{
			id: 'avatars',
			name: t('Avatars'),
			icon: 'user-rounded',
			input: <ToggleSwitch mie='x16' onChange={handleChangeSidebarDisplayAvatar} checked={sidebarDisplayAvatar} />,
		},
	];
};
