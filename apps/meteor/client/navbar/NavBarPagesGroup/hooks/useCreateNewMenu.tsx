import { useAtLeastOnePermission, useUserId } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { useCreateNewItems } from './useCreateNewItems';
import { useCreateRoomModal } from './useCreateRoomModal';
import CreateUserRoomCategoryModal from '../actions/CreateUserRoomCategoryModal';

const CREATE_ROOM_PERMISSIONS = ['create-c', 'create-p', 'create-d', 'start-discussion', 'start-discussion-other-user'];

export const useCreateNewMenu = () => {
	const { t } = useTranslation();
	const userId = useUserId();
	const showCreate = useAtLeastOnePermission(CREATE_ROOM_PERMISSIONS);

	const createRoomItems = useCreateNewItems();
	const openCreateUserRoomCategoryModal = useCreateRoomModal(CreateUserRoomCategoryModal);

	const createUserRoomCategoryItem = userId
		? {
				id: 'user-room-category',
				content: t('Create_user_room_category'),
				icon: 'sort-amount-down' as const,
				onClick: () => {
					openCreateUserRoomCategoryModal();
				},
			}
		: null;

	const items = [...createRoomItems, ...(createUserRoomCategoryItem ? [createUserRoomCategoryItem] : [])];

	const sections = [{ title: t('Create_new'), items, permission: showCreate || Boolean(userId) }];

	return sections.filter((section) => section.permission && section.items.length > 0);
};
