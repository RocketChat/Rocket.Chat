import { RadioButton, ToggleSwitch } from '@rocket.chat/fuselage';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useEndpoint, useUserPreference } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

export const useViewModeItems = (): GenericMenuItemProps[] => {
	const { t } = useTranslation();

	const saveUserPreferences = useEndpoint('POST', '/v1/users.setPreferences');

	const useHandleChange = (value: 'extended' | 'condensed'): (() => void) =>
		useCallback(() => saveUserPreferences({ data: { sidebarViewMode: value } }), [value]);

	const sidebarViewMode = useUserPreference<'extended' | 'condensed'>('sidebarViewMode', 'condensed');
	const sidebarDisplayAvatar = useUserPreference('sidebarDisplayAvatar', false);

	const setToExtended = useHandleChange('extended');
	const setToCondensed = useHandleChange('condensed');

	const handleChangeSidebarDisplayAvatar = useCallback(
		() => saveUserPreferences({ data: { sidebarDisplayAvatar: !sidebarDisplayAvatar } }),
		[saveUserPreferences, sidebarDisplayAvatar],
	);

	return [
		{
			id: 'extended',
			content: t('Detailed'),
			icon: 'extended-view',
			onClick: setToExtended,
			addon: <RadioButton checked={sidebarViewMode === 'extended'} onChange={() => undefined} />,
		},
		{
			id: 'condensed',
			content: t('Compact'),
			icon: 'condensed-view',
			onClick: setToCondensed,
			addon: <RadioButton checked={sidebarViewMode !== 'extended'} onChange={() => undefined} />,
		},
		{
			id: 'avatars',
			content: t('Avatars'),
			icon: 'user-rounded',
			onClick: handleChangeSidebarDisplayAvatar,
			addon: <ToggleSwitch checked={sidebarDisplayAvatar} onChange={() => undefined} />,
		},
	];
};
