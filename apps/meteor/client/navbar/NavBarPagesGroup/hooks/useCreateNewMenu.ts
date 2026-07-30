import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useAtLeastOnePermission } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { useCreateNewItems } from './useCreateNewItems';
import { useCategoryModals } from '../../../sidebar/categories/useCategoryModals';

const CREATE_ROOM_PERMISSIONS = ['create-c', 'create-p', 'create-d', 'start-discussion', 'start-discussion-other-user'];

export const useCreateNewMenu = () => {
	const { t } = useTranslation();
	const showCreate = useAtLeastOnePermission(CREATE_ROOM_PERMISSIONS);
	const { openCreate } = useCategoryModals();

	const createRoomItems = useCreateNewItems();

	const sections = [
		{ title: t('Create_new'), items: createRoomItems, permission: showCreate },
		{
			items: [{ id: 'category', icon: 'folder', content: t('Category'), onClick: () => openCreate() }] as GenericMenuItemProps[],
			permission: true,
		},
	];

	return sections.filter((section) => section.permission);
};
