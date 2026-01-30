import type { Dispatch, SetStateAction } from 'react';
import { useState } from 'react';

type UseItemsPerPageValue = 25 | 50 | 100;

export const useItemsPerPage = (
	itemsPerPageInitialValue: UseItemsPerPageValue = 25,
): [UseItemsPerPageValue, Dispatch<SetStateAction<UseItemsPerPageValue>>] => {
	const [itemsPerPage, setItemsPerPage] = useState<UseItemsPerPageValue>(itemsPerPageInitialValue);

	return [itemsPerPage, setItemsPerPage];
};
