import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useAtLeastOnePermission } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { useCreateNewItems } from './useCreateNewItems';
import { useCategoryModals } from '../../../views/navigation/sidebar/categories/useCategoryModals';

const CREATE_ROOM_PERMISSIONS = ['create-c', 'create-p', 'create-d', 'start-discussion', 'start-discussion-other-user'];

export const useCreateNewMenu = () => {
	const { t } = useTranslation();
	const showCreate = useAtLeastOnePermission(CREATE_ROOM_PERMISSIONS);
	const { openCreate } = useCategoryModals();

	const createRoomItems = useCreateNewItems();

	const categoryItem: GenericMenuItemProps = { id: 'category', icon: 'folder', content: t('Category'), onClick: () => openCreate() };

	// Category sits below the room types, separated by a divider (its own section).
	const sections = [
		{ title: t('Create_new'), items: createRoomItems, permission: showCreate },
		{ items: [categoryItem], permission: true },
	];

	return sections.filter((section) => section.permission);
};
