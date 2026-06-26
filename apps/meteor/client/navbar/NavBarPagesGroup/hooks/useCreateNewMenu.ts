import { useAtLeastOnePermission } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { useCreateNewItems } from './useCreateNewItems';
import useCreateCategoryModal from '../../../sidebar/categories/useCreateCategoryModal';

const CREATE_ROOM_PERMISSIONS = ['create-c', 'create-p', 'create-d', 'start-discussion', 'start-discussion-other-user'];

export const useCreateNewMenu = () => {
	const { t } = useTranslation();
	const showCreate = useAtLeastOnePermission(CREATE_ROOM_PERMISSIONS);

	const createRoomItems = useCreateNewItems();
	const createCategoriesItem = useCreateCategoryModal();

	const sections = [
		{ title: t('Create_new'), items: createRoomItems, permission: showCreate },
		{ title: '', items: [createCategoriesItem], permission: true },
	];

	return sections.filter((section) => section.permission);
};
