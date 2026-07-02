import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useFeaturePreview } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import { useDisplayCategoriesItems } from './useDisplayCategoriesItems';
import { useDynamicCategoryItems } from './useDynamicCategoryItems';
import { useGroupingListItems } from './useGroupingListItems';
import { useSortModeItems } from './useSortModeItems';
import { useViewModeItems } from './useViewModeItems';

export const useSortMenu = () => {
	const { t } = useTranslation();
	const secondSidebarEnabled = useFeaturePreview('secondarySidebar');

	const viewModeItems = useViewModeItems();
	const sortModeItems = useSortModeItems();
	const groupingListItems = useGroupingListItems();
	const displayCategoriesItems = useDisplayCategoriesItems();
	const dynamicCategoryItems = useDynamicCategoryItems();

	// The classic sidebar uses the new "Display categories" + "Dynamic" sections; the navigation sidebar keeps
	// its existing "Group by" grouping menu.
	return [
		!secondSidebarEnabled ? { title: t('Display'), items: viewModeItems } : undefined,
		!secondSidebarEnabled ? { title: t('Display_categories'), items: displayCategoriesItems } : undefined,
		!secondSidebarEnabled ? { title: t('Dynamic'), items: dynamicCategoryItems } : undefined,
		{ title: t('Sort_By'), items: sortModeItems },
		secondSidebarEnabled ? { title: t('Group_by'), items: groupingListItems } : undefined,
	].filter(Boolean) as { title: string; items: GenericMenuItemProps[] }[];
};
