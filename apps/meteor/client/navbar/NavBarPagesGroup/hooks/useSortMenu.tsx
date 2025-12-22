import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useFeaturePreview } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import { useGroupingListItems } from './useGroupingListItems';
import { useSortModeItems } from './useSortModeItems';
import { useViewModeItems } from './useViewModeItems';

export const useSortMenu = () => {
	const { t } = useTranslation();
	const secondSidebarEnabled = useFeaturePreview('secondarySidebar');

	const viewModeItems = useViewModeItems();
	const sortModeItems = useSortModeItems();
	const groupingListItems = useGroupingListItems();

	return [
		!secondSidebarEnabled ? { title: t('Display'), items: viewModeItems } : undefined,
		{ title: t('Sort_By'), items: sortModeItems },
		{ title: t('Group_by'), items: groupingListItems },
	].filter(Boolean) as { title: string; items: GenericMenuItemProps[] }[];
};
