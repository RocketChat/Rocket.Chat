import { CheckBox } from '@rocket.chat/fuselage';
import { useFeaturePreview, type GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useEndpoint, useSetModal, useUserPreference } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import ManageCategoriesModal from '../actions/ManageCategoriesModal';

export const useGroupingListItems = (): GenericMenuItemProps[] => {
	const { t } = useTranslation();
	const secondSidebarEnabled = useFeaturePreview('secondarySidebar');
	const setModal = useSetModal();

	const sidebarGroupByType = useUserPreference<boolean>('sidebarGroupByType');
	const sidebarShowFavorites = useUserPreference<boolean>('sidebarShowFavorites');
	const sidebarShowUnread = useUserPreference<boolean>('sidebarShowUnread');

	const saveUserPreferences = useEndpoint('POST', '/v1/users.setPreferences');

	const useHandleChange = (key: 'sidebarGroupByType' | 'sidebarShowFavorites' | 'sidebarShowUnread', value: boolean): (() => void) =>
		useCallback(() => saveUserPreferences({ data: { [key]: value } }), [key, value]);

	const handleChangeGroupByType = useHandleChange('sidebarGroupByType', !sidebarGroupByType);
	const handleChangeShoFavorite = useHandleChange('sidebarShowFavorites', !sidebarShowFavorites);
	const handleChangeShowUnread = useHandleChange('sidebarShowUnread', !sidebarShowUnread);

	const handleManageCategories = useCallback(
		() => setModal(<ManageCategoriesModal onClose={() => setModal(null)} />),
		[setModal],
	);

	return [
		{
			id: 'unread',
			content: t('Unread'),
			icon: 'flag',
			addon: <CheckBox onChange={handleChangeShowUnread} checked={sidebarShowUnread} />,
		},
		!secondSidebarEnabled && {
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
		{
			id: 'manage-categories',
			content: t('Manage_category_order'),
			icon: 'sort',
			onClick: handleManageCategories,
		},
	].filter(Boolean) as GenericMenuItemProps[];
};
