import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { dispatchToastMessage } from '../../../../lib/toast';
import type {
	RoomTypeDropDownListProps,
	RoomDropDownGroups,
	RoomTypeOnSelected,
	RoomVisibilityOnSelected,
	selectedCategoriesList,
} from '../RoomDropDown/RoomDropdownDefinitions';

export const useRoomFilters = (): [RoomDropDownGroups, selectedCategoriesList, RoomTypeOnSelected | RoomVisibilityOnSelected] => {
	const t = useTranslation();
	const [roomTypes, setRoomTypes] = useState<RoomTypeDropDownListProps['categories']>([]);

	try {
		const fetchRoomTypes = useEndpoint('GET', '/v1/rooms.adminRooms');

		const mappedRoomTypes = fetchRoomTypes.map((currentRoomType) => ({
			id: currentRoomType.id,
			label: currentRoomType.title,
			checked: false,
      }));
      
      setCategories([
				{
					items: [
						{
							id: 'all',
							label: t('All_categories'),
						},
					],
				},
				{
					label: t('Filter_by_category'),
					items: mappedCategories,
				},
			]);
	} catch (error: unknown) {
		dispatchToastMessage({ type: 'error', message: error });
	}
};
