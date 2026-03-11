import type { IRoom } from '@rocket.chat/core-typings';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';

import { useEndpoint } from './useEndpoint';
import { useRouter } from './useRouter';

export const useGoToRoom = (): ((roomId: IRoom['_id']) => Promise<void>) => {
	const router = useRouter();
	const getRoomById = useEndpoint('GET', '/v1/rooms.info');

	return useStableCallback(async (roomId: IRoom['_id']) => {
		const { room } = await getRoomById({ roomId });

		if (!room) return;

		const { t, name, _id: rid } = room;

		const { path } = router.getRoomRoute(t, ['c', 'p'].includes(t) ? { name } : { rid });

		router.navigate({ pathname: path });
	});
};
