import { useCallback } from 'react';

import { FreePaidDropDownItem, FreePaidDropDownOnSelected, FreePaidDropDownSetData } from '../definitions/FreePaidDropDownDefinitions';

export const useFreePaidToggle = (setData: FreePaidDropDownSetData): FreePaidDropDownOnSelected => {
	const onSelected = useCallback(
		(item: FreePaidDropDownItem) =>
			setData((prevState) => {
				prevState.items.forEach((currentItem) => {
					if (currentItem !== item) {
						currentItem.checked = false;
					}

					if (currentItem === item) {
						currentItem.checked = true;
					}
				});
				return { ...prevState };
			}),
		[setData],
	);

	return onSelected;
};
