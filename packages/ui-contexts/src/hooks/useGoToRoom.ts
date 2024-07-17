import type { IRoom } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';

import { useEndpoint } from './useEndpoint';
import { useRouter } from './useRouter';

export const useGoToRoom = ({ replace = false }: { replace?: boolean } = {}): ((rid: IRoom['_id']) => void) => {
	const router = useRouter();
	const getRoomById = useEndpoint('GET', '/v1/rooms.info');

	return useEffectEvent(async (rid) => {
		const { room } = await getRoomById({ roomId: rid });

		if (!room) {
			return;
		}

		const { path } = router.getRoomRoute(room.t, rid);

		router.navigate(
			{
				pathname: path,
			},
			{ replace },
		);
	});
};
