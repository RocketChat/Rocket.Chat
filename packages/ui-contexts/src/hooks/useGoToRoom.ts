import type { IRoom } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
// import type { Key } from 'react';

import { useEndpoint } from './useEndpoint';
import { useRouter } from './useRouter';

export const useGoToRoom = ({ replace = false }: { replace?: boolean } = {}): ((rid: IRoom['_id']) => void) => {
	const router = useRouter();
	const getRoomById = useEndpoint('GET', '/v1/rooms.info');

	return useEffectEvent(async (roomId: string) => {
		const { room } = await getRoomById({ roomId });

		if (!room) {
			return;
		}

		const { t, name, _id: rid } = room;

		const { path } = router.getRoomRoute(t, ['c', 'p'].includes(t) ? { name } : { rid });

		router.navigate(
			{
				pathname: path,
			},
			{ replace },
		);
	});
};
