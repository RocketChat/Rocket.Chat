import { useTranslation } from 'react-i18next';

import { useCreateNewItems } from './useCreateNewItems';

export const useCreateNewMenu = () => {
	const { t } = useTranslation();

	const createRoomItems = useCreateNewItems();

	const sections = [{ title: t('Create_new'), items: createRoomItems }];

	return sections.filter((section) => section.items.length > 0);
};
