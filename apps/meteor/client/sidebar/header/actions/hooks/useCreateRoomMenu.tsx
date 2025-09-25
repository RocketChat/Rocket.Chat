import { useAtLeastOnePermission } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { useCreateRoomItems } from './useCreateRoomItems';

const CREATE_ROOM_PERMISSIONS = ['create-c', 'create-p', 'create-d', 'start-discussion', 'start-discussion-other-user'];

export const useCreateRoom = () => {
	const { t } = useTranslation();
	const showCreate = useAtLeastOnePermission(CREATE_ROOM_PERMISSIONS);

	const createRoomItems = useCreateRoomItems();

	const sections = [{ title: t('Create_new'), items: createRoomItems, permission: showCreate }];

	return sections.filter((section) => section.permission);
};
