import { RadioButton, ToggleSwitch } from '@rocket.chat/fuselage';
import { useEndpoint, useUserPreference, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useCallback } from 'react';

import type { GenericMenuItemProps } from '../../../../components/GenericMenu/GenericMenuItem';

export const useViewModeItems = (): GenericMenuItemProps[] => {
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
			content: t('Extended'),
			icon: 'extended-view',
			addon: <RadioButton mi={16} onChange={setToExtended} checked={sidebarViewMode === 'extended'} />,
		},
		{
			id: 'medium',
			content: t('Medium'),
			icon: 'medium-view',
			addon: <RadioButton mi={16} onChange={setToMedium} checked={sidebarViewMode === 'medium'} />,
		},
		{
			id: 'condensed',
			content: t('Condensed'),
			icon: 'condensed-view',
			addon: <RadioButton mi={16} onChange={setToCondensed} checked={sidebarViewMode === 'condensed'} />,
		},
		{
			id: 'avatars',
			content: t('Avatars'),
			icon: 'user-rounded',
			addon: <ToggleSwitch mie={16} onChange={handleChangeSidebarDisplayAvatar} checked={sidebarDisplayAvatar} />,
		},
	];
};
