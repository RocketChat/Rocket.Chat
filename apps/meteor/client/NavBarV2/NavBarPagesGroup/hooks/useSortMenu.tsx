import { useTranslation } from 'react-i18next';

import { useGroupingListItems } from './useGroupingListItems';
import { useSortModeItems } from './useSortModeItems';

export const useSortMenu = () => {
	const { t } = useTranslation();

	const sortModeItems = useSortModeItems();
	const groupingListItems = useGroupingListItems();

	const sections = [
		{ title: t('Sort_By'), items: sortModeItems },
		{ title: t('Group_by'), items: groupingListItems },
	];

	return sections;
};
