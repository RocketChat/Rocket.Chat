import { RadioButton, ToggleSwitch } from '@rocket.chat/fuselage';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useEndpoint, useUserPreference } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

export const useViewModeItems = (): GenericMenuItemProps[] => {
	const { t } = useTranslation();

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
			addon: <RadioButton onChange={setToExtended} checked={sidebarViewMode === 'extended'} />,
		},
		{
			id: 'medium',
			content: t('Medium'),
			icon: 'medium-view',
			addon: <RadioButton onChange={setToMedium} checked={sidebarViewMode === 'medium'} />,
		},
		{
			id: 'condensed',
			content: t('Condensed'),
			icon: 'condensed-view',
			addon: <RadioButton onChange={setToCondensed} checked={sidebarViewMode === 'condensed'} />,
		},
		{
			id: 'avatars',
			content: t('Avatars'),
			icon: 'user-rounded',
			addon: <ToggleSwitch onChange={handleChangeSidebarDisplayAvatar} checked={sidebarDisplayAvatar} />,
		},
	];
};
