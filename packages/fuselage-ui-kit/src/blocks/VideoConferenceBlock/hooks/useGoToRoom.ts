import type { IRoom, Serialized } from '@rocket.chat/core-typings';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useRouter } from '@rocket.chat/ui-contexts';

/* The route is typed by its migrated implementation inside the meteor app
 * (apps/meteor/server/api/v1/rooms.ts augments `Endpoints` via
 * ExtractRoutesFromAPI), so the standalone `Endpoints` map from
 * @rocket.chat/rest-typings no longer declares it. This package compiles
 * without that augmentation and keeps its own minimal contract, mirroring
 * the server response. */
type RoomsInfoResponse = {
	room: Serialized<IRoom> | null;
};

export const useGoToRoom = (): ((roomId: IRoom['_id']) => Promise<void>) => {
	const router = useRouter();
	const getRoomInfo = useEndpoint('GET', '/v1/rooms.info' as unknown as Parameters<typeof useEndpoint>[1]) as unknown as (params: {
		roomId: string;
	}) => Promise<RoomsInfoResponse>;

	return useStableCallback(async (roomId: IRoom['_id']) => {
		const { room } = await getRoomInfo({ roomId });

		if (!room) return;

		const { t, name, _id: rid } = room;

		const { path } = router.getRoomRoute(t, ['c', 'p'].includes(t) ? { name } : { rid });

		router.navigate({ pathname: path });
	});
};
