import type { IRoom } from '@rocket.chat/core-typings';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useCallback, useState } from 'react';

import { useScrollableRecordList } from './lists/useScrollableRecordList';
import { useComponentDidUpdate } from './useComponentDidUpdate';
import { RecordList } from '../lib/lists/RecordList';

type RoomListOptions = {
	text: string;
};

type IRoomClient = Pick<IRoom, '_updatedAt' | '_id'> & {
	label: string;
	value: string;
};

export const useRoomsList = (
	options: RoomListOptions,
): {
	itemsList: RecordList<IRoomClient>;
	initialItemCount: number;
	reload: () => void;
	loadMoreItems: (start: number, end: number) => void;
} => {
	const [itemsList, setItemsList] = useState(() => new RecordList<IRoomClient>());
	const reload = useCallback(() => setItemsList(new RecordList<IRoomClient>()), []);

	const getRooms = useEndpoint('GET', '/v1/rooms.autocomplete.channelAndPrivate.withPagination');

	useComponentDidUpdate(() => {
		options && reload();
	}, [options, reload]);

	const fetchData = useCallback(
		async (start: number, end: number) => {
			const { items: rooms, total } = await getRooms({
				selector: JSON.stringify({ name: options.text || '' }),
				offset: start,
				count: start + end,
				sort: JSON.stringify({ name: 1 }),
			});

			const items = rooms.map((room: any) => ({
				_id: room._id,
				_updatedAt: new Date(room._updatedAt),
				label: room.name ?? '',
				value: room.name ?? '',
			}));

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
