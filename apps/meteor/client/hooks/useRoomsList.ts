import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useInfiniteQuery } from '@tanstack/react-query';

import { roomsQueryKeys } from '../lib/queryKeys';

export const useRoomsList = ({ text }: { text: string }) => {
	const getRooms = useEndpoint('GET', '/v1/rooms.autocomplete.channelAndPrivate.withPagination');

	const count = 25;

	return useInfiniteQuery({
		queryKey: roomsQueryKeys.autocomplete(text),
		queryFn: async ({ pageParam: offset }) => {
			const { items: rooms, total } = await getRooms({
				selector: JSON.stringify({ name: text }),
				offset,
				count,
				sort: JSON.stringify({ name: 1 }),
			});

			const items = rooms.map((room) => ({
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
		initialPageParam: 0,
		getNextPageParam: (lastPage, _, lastOffset) => {
			const nextOffset = lastOffset + count;
			if (nextOffset >= lastPage.itemCount) return undefined;
			return nextOffset;
		},
		select: ({ pages }) => pages.flatMap((page) => page.items),
	});
};
