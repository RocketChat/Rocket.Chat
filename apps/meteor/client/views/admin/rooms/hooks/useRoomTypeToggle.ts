import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import type { RoomDropdownItem, RoomTypeDropDownListProps } from '../RoomDropDown/RoomDropdownDefinitions';

export const useRoomTypeToggle = (
	setData: Dispatch<SetStateAction<RoomTypeDropDownListProps['categories']>>,
): RoomTypeDropDownListProps['onSelected'] => {
	const onSelected = useCallback(
		(item: RoomDropdownItem) =>
			setData((prev) => {
				const roomTypes = prev.flatMap((group) => group.items);

				const roomTypesWithoutAll = roomTypes.filter(({ id }) => id !== 'all');
				const allRoomTypesOption = roomTypes.find(({ id }) => id === 'all');
				const toggledRoomType = roomTypes.find(({ id }) => id === item.id);

				const isAllRoomTypesToggled = item.id === 'all';

				if (isAllRoomTypesToggled) {
					roomTypesWithoutAll.forEach((currentItem) => {
						currentItem.checked = !item.checked;
					});
				}

				if (toggledRoomType) {
					toggledRoomType.checked = !toggledRoomType.checked;
				}

				if (allRoomTypesOption && roomTypesWithoutAll.some((currentRoomType) => currentRoomType.checked === false)) {
					allRoomTypesOption.checked = false;
				}

				return [...prev];
			}),
		[setData],
	);

	return onSelected;
};
