import { CheckBox } from '@rocket.chat/fuselage';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useEndpoint, useUserPreference } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

export const useGroupingListItems = (): GenericMenuItemProps[] => {
	const { t } = useTranslation();

	const sidebarGroupByType = useUserPreference<boolean>('sidebarGroupByType');
	const sidebarShowFavorites = useUserPreference<boolean>('sidebarShowFavorites');
	const sidebarShowUnread = useUserPreference<boolean>('sidebarShowUnread');

	const saveUserPreferences = useEndpoint('POST', '/v1/users.setPreferences');

	const useHandleChange = (key: 'sidebarGroupByType' | 'sidebarShowFavorites' | 'sidebarShowUnread', value: boolean): (() => void) =>
		useCallback(() => saveUserPreferences({ data: { [key]: value } }), [key, value]);

	const handleChangeGroupByType = useHandleChange('sidebarGroupByType', !sidebarGroupByType);
	const handleChangeShoFavorite = useHandleChange('sidebarShowFavorites', !sidebarShowFavorites);
	const handleChangeShowUnread = useHandleChange('sidebarShowUnread', !sidebarShowUnread);

	return [
		{
			id: 'unread',
			content: t('Unread'),
			icon: 'flag',
			addon: <CheckBox onChange={handleChangeShowUnread} checked={sidebarShowUnread} />,
		},
		{
			id: 'favorites',
			content: t('Favorites'),
			icon: 'star',
			addon: <CheckBox onChange={handleChangeShoFavorite} checked={sidebarShowFavorites} />,
		},
		{
			id: 'types',
			content: t('Types'),
			icon: 'group-by-type',
			addon: <CheckBox onChange={handleChangeGroupByType} checked={sidebarGroupByType} />,
		},
	];
};
