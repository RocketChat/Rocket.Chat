import { useGroupingListItems } from './useGroupingListItems';
import { useSortModeItems } from './useSortModeItems';
import { useViewModeItems } from './useViewModeItems';

export const useSortMenu = () => {
	const viewModeItems = useViewModeItems();
	const sortModeItems = useSortModeItems();
	const groupingListItems = useGroupingListItems();

	const sections = [
		{ title: 'Display', items: viewModeItems },
		{ title: 'Sort_By', items: sortModeItems },
		{ title: 'Group_by', items: groupingListItems },
	];

	return sections;
};
