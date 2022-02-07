import { useCallback } from 'react';

import { FreePaidDropDownItem, FreePaidDropDownOnSelected, FreePaidDropDownSetData } from '../definitions/FreePaidDropDownDefinitions';

export const useFreePaidToggle = (setData: FreePaidDropDownSetData): FreePaidDropDownOnSelected => {
	const onSelected = useCallback(
		(item: FreePaidDropDownItem) =>
			setData((prevState) => {
				prevState.items.forEach((currentItem) => {
					currentItem.checked = currentItem === item;
				});
				return { ...prevState };
			}),
		[setData],
	);

	return onSelected;
};
