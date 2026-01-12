import { useTranslation } from 'react-i18next';

import { useCreateNewItems } from './useCreateNewItems';

export const useCreateNewMenu = () => {
	const { t } = useTranslation();
	const createRoomItems = useCreateNewItems();
	const showCreate = createRoomItems.length > 0;

	const sections = [{ title: t('Create_new'), items: createRoomItems, permission: showCreate }];

	return sections.filter((section) => section.permission);
};
