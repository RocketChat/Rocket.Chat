import type { GenericMenuItemProps } from '@rocket.chat/ui-client';

import { useRoomCategoryItems } from './useRoomCategoryItems';

type UseCategoryMenuItemsParams = {
	rid: string;
	name?: string;
	isFavorite: boolean;
	categoryId?: string;
};

type UseCategoryMenuItemsResult = {
	/** Category targets — every destination except "New category". */
	targetItems: GenericMenuItemProps[];
	/** Utility actions: "New category" (if present) + "Remove from category" (if applicable). */
	utilItems: GenericMenuItemProps[];
	/** All category items combined, for building disabled-keys and action maps. */
	allCategoryItems: GenericMenuItemProps[];
};

export const useCategoryMenuItems = ({
	rid,
	name = '',
	isFavorite,
	categoryId,
}: UseCategoryMenuItemsParams): UseCategoryMenuItemsResult => {
	const { moveToItems, removeItem } = useRoomCategoryItems({ rid, name, isFavorite, categoryId });

	const targetItems = moveToItems.filter((item) => item.id !== 'newCategory');
	const newCategoryItem = moveToItems.find((item) => item.id === 'newCategory');
	const utilItems = [...(newCategoryItem ? [newCategoryItem] : []), ...(removeItem ? [removeItem] : [])];

	return {
		targetItems,
		utilItems,
		allCategoryItems: [...moveToItems, ...(removeItem ? [removeItem] : [])],
	};
};
