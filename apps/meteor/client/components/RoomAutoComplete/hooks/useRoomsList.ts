import type { IRoom } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useCallback, useState } from 'react';

import { useScrollableRecordList } from '../../../hooks/lists/useScrollableRecordList';
import { useComponentDidUpdate } from '../../../hooks/useComponentDidUpdate';
import { RecordList } from '../../../lib/lists/RecordList';

type RoomListOptions = {
	text: string;
};

export const useRoomsList = (
	options: RoomListOptions,
): {
	itemsList: RecordList<IRoom>;
	initialItemCount: number;
	reload: () => void;
	loadMoreItems: (start: number, end: number) => void;
} => {
	const [itemsList, setItemsList] = useState(() => new RecordList<IRoom>());
	const reload = useCallback(() => setItemsList(new RecordList<IRoom>()), []);
	const endpoint = 'rooms.autocomplete.channelAndPrivate.withPagination';

	const getRooms = useEndpoint('GET', endpoint);

	useComponentDidUpdate(() => {
		options && reload();
	}, [options, reload]);

	const fetchData = useCallback(
		async (start, end) => {
			const { items: rooms, total } = await getRooms({
				selector: JSON.stringify({ name: options.text || '' }),
				offset: start,
				count: start + end,
				sort: JSON.stringify({ name: 1 }),
			});

			const items = rooms.map((room: any) => {
				room._updatedAt = new Date(room._updatedAt);
				room.label = room.name;
				room.value = room.name;
				return room;
			});

			return {
				items,
				itemCount: total,
			};
		},
		[getRooms, options.text],
	);

	const { loadMoreItems, initialItemCount } = useScrollableRecordList(itemsList, fetchData, 25);

	return {
		reload,
		itemsList,
		loadMoreItems,
		initialItemCount,
	};
};
