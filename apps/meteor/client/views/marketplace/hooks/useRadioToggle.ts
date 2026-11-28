import { useCallback } from 'react';

import type { RadioDropDownItem, RadioDropDownOnSelected, RadioDropDownSetData } from '../definitions/RadioDropDownDefinitions';

export const useRadioToggle = (setData: RadioDropDownSetData): RadioDropDownOnSelected => {
	const onSelected = useCallback(
		(item: RadioDropDownItem) => {
			setData((prevState) => ({
				...prevState,
				items: prevState.items.map((currentItem) => ({ ...currentItem, checked: currentItem.id === item.id })),
			}));
		},
		[setData],
	);
	return onSelected;
};
