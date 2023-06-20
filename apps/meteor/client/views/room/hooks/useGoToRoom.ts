import type { IRoom, ISubscription } from '@rocket.chat/core-typings';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useMethod, useRouter } from '@rocket.chat/ui-contexts';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { ChatSubscription } from '../../../../app/models/client';
import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';

export const useGoToRoom = ({ replace = false }: { replace?: boolean } = {}): ((rid: IRoom['_id']) => void) => {
	const getRoomById = useMethod('getRoomById');
	const router = useRouter();

	// TODO: remove params recycling
	return useMutableCallback(async (rid) => {
		if (!rid) {
			return;
		}

		const go = (fn: () => void) => (replace ? FlowRouter.withReplaceState(fn) : fn());

		const subscription: ISubscription | undefined = ChatSubscription.findOne({ rid });

		if (subscription) {
			go(() => roomCoordinator.openRouteLink(subscription.t, subscription, router.getSearchParameters()));
			return;
		}

		const room = await getRoomById(rid);
		go(() => roomCoordinator.openRouteLink(room.t, { rid: room._id, ...room }, router.getSearchParameters()));
	});
};
