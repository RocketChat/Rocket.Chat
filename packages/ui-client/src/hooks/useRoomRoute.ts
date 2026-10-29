import type { IRoom, RoomType } from '@rocket.chat/core-typings';
import { useRouter } from '@rocket.chat/ui-contexts';
import { useCallback } from 'react';

type RoomRouteData = {
	rid: IRoom['_id'];
	t: RoomType;
	name?: IRoom['name'];
};

/**
 * Returns a function to navigate to a room using existing room data.
 * Unlike `useGoToRoom`, this doesn't make an API call - use it when you already have the room data.
 */
export const useRoomRoute = ({ replace = false }: { replace?: boolean } = {}): ((room: RoomRouteData) => void) => {
	const router = useRouter();

	return useCallback(
		(room: RoomRouteData) => {
			const { t, name, rid } = room;
			const { path } = router.getRoomRoute(t, ['c', 'p'].includes(t) ? { name } : { rid });

			router.navigate(
				{
					pathname: path,
				},
				{ replace },
			);
		},
		[router, replace],
	);
};
