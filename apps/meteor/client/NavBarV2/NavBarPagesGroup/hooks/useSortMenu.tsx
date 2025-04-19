import { useTranslation } from 'react-i18next';

import { useGroupingListItems } from './useGroupingListItems';
import { useSortModeItems } from './useSortModeItems';
import { useViewModeItems } from './useViewModeItems';

export const useSortMenu = () => {
	const { t } = useTranslation();

	const viewModeItems = useViewModeItems();
	const sortModeItems = useSortModeItems();
	const groupingListItems = useGroupingListItems();

	const sections = [
		{ title: t('Display'), items: viewModeItems },
		{ title: t('Sort_By'), items: sortModeItems },
		{ title: t('Group_by'), items: groupingListItems },
	];

	return sections;
};
