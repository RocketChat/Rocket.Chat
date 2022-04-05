import { useState } from 'react';

type UseItemsPerPageValue = 25 | 50 | 100;

export const useItemsPerPage = (
	itemsPerPageInitialValue: UseItemsPerPageValue = 25,
): [UseItemsPerPageValue, React.Dispatch<React.SetStateAction<UseItemsPerPageValue>>] => {
	const [itemsPerPage, setItemsPerPage] = useState<UseItemsPerPageValue>(itemsPerPageInitialValue);

	return [itemsPerPage, setItemsPerPage];
};
