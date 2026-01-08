import { useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useStream, useUser } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useRoomRejectInvitationModal } from './useRoomRejectInvitationModal';
import { useEndpointMutation } from '../../../hooks/useEndpointMutation';
import { roomsQueryKeys, subscriptionsQueryKeys } from '../../../lib/queryKeys';
import type { IRoomWithFederationOriginalName } from '../contexts/RoomContext';

export const useRoomInvitation = (room: IRoomWithFederationOriginalName) => {
	const user = useUser();

	if (!user) {
		throw new Error('error-user-not-found');
	}

	const queryClient = useQueryClient();
	const subscribeToNotifyUser = useStream('notify-user');
	const { open: openConfirmationModal } = useRoomRejectInvitationModal(room);
	const replyInvite = useEndpointMutation('POST', '/v1/rooms.invite');

	const invalidateQueries = useEffectEvent(() => {
		const reference = room.federationOriginalName ?? room.name ?? room._id;
		return Promise.all([
			queryClient.invalidateQueries({ queryKey: roomsQueryKeys.room(room._id) }),
			queryClient.invalidateQueries({ queryKey: subscriptionsQueryKeys.subscription(room._id) }),
			queryClient.refetchQueries({
				queryKey: roomsQueryKeys.roomReference(reference, room.t, user._id, user.username),
			}),
		]);
	});

	useEffect(() => {
		// Only listen for subscription changes if the mutation has been initiated
		if (!replyInvite.isPending) {
			return;
		}

		/*
		 * NOTE: We need to listen for subscription changes here because when accepting an invitation
		 * to a federated room, the server processes the acceptance asynchronously. Therefore,
		 * we cannot rely solely on the mutation's completion to know when the subscription status
		 * has changed. By subscribing to the 'notify-user' stream, we can react to changes in the
		 * subscription status and ensure that our UI reflects the most up-to-date information.
		 */
		return subscribeToNotifyUser(`${user._id}/subscriptions-changed`, async (event, data) => {
			if (data.rid !== room._id) {
				return;
			}

			if (event !== 'removed' && data.status !== undefined) {
				return;
			}

			await invalidateQueries();
		});
	}, [room._id, user._id, invalidateQueries, replyInvite.isPending, subscribeToNotifyUser]);

	return {
		...replyInvite,
		acceptInvite: async () => replyInvite.mutate({ roomId: room._id, action: 'accept' }),
		rejectInvite: async () => {
			if (await openConfirmationModal()) replyInvite.mutate({ roomId: room._id, action: 'reject' });
		},
	};
};
