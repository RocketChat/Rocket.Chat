import { useCallback } from 'react';

import type { RadioDropDownItem, RadioDropDownOnSelected, RadioDropDownSetData } from '../definitions/RadioDropDownDefinitions';

export const useRadioToggle = (setData: RadioDropDownSetData): RadioDropDownOnSelected => {
	const onSelected = useCallback(
		(item: RadioDropDownItem) => {
			setData((prevState) => {
				prevState.items.forEach((currentItem) => {
					currentItem.checked = currentItem === item;
				});
				return { ...prevState };
			});
		},
		[setData],
	);
	return onSelected;
};
