import type { IRoom, ISubscription } from '@rocket.chat/core-typings';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { useMethod, useRouter, useToastMessageDispatch } from '@rocket.chat/ui-contexts';

import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';
import { Subscriptions } from '../../../stores';

type GoToRoomByIdOptions = {
	replace?: boolean;
	routeParamsOverrides?: Record<string, string>;
};

export const useGoToRoom = (): ((roomId: IRoom['_id'], options?: GoToRoomByIdOptions) => Promise<void>) => {
	const router = useRouter();
	const getRoomById = useMethod('getRoomById');
	const dispatchToastMessage = useToastMessageDispatch();

	// TODO: remove params recycling
	return useStableCallback(async (roomId: IRoom['_id'], options?: GoToRoomByIdOptions) => {
		if (!roomId) return;

		const subscription: ISubscription | undefined = Subscriptions.state.find((record) => record.rid === roomId);

		if (subscription) {
			roomCoordinator.openRouteLink(subscription.t, subscription, router.getSearchParameters(), options);
			return;
		}

		try {
			const room = await getRoomById(roomId);
			roomCoordinator.openRouteLink(room.t, { rid: room._id, ...room }, router.getSearchParameters(), options);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	});
};
