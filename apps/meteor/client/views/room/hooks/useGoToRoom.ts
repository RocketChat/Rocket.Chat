import type { IRoom, ISubscription } from '@rocket.chat/core-typings';
import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useMethod, useRouter } from '@rocket.chat/ui-contexts';

import { Subscriptions } from '../../../../app/models/client';
import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';

export const useGoToRoom = ({ replace = false }: { replace?: boolean } = {}): ((rid: IRoom['_id']) => void) => {
	const getRoomById = useMethod('getRoomById');
	const router = useRouter();

	// TODO: remove params recycling
	return useEffectEvent(async (rid: IRoom['_id']) => {
		if (!rid) {
			return;
		}

		const subscription: ISubscription | undefined = Subscriptions.findOne({ rid });

		if (subscription) {
			roomCoordinator.openRouteLink(subscription.t, subscription, router.getSearchParameters(), { replace });
			return;
		}

		const room = await getRoomById(rid);
		roomCoordinator.openRouteLink(room.t, { rid: room._id, ...room }, router.getSearchParameters(), { replace });
	});
};
