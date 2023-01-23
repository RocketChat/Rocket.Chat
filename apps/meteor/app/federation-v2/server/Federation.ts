import type { IRoom, IUser, ValueOf } from '@rocket.chat/core-typings';
import { isRoomFederated, isDirectMessageRoom } from '@rocket.chat/core-typings';
import { Subscriptions } from '@rocket.chat/models';

import { RoomMemberActions } from '../../../definition/IRoomTypeConfig';
import { escapeExternalFederationEventId, unescapeExternalFederationEventId } from './infrastructure/rocket-chat/adapters/MessageConverter';

const allowedActionsInFederatedRooms: ValueOf<typeof RoomMemberActions>[] = [
	RoomMemberActions.REMOVE_USER,
	RoomMemberActions.SET_AS_OWNER,
	RoomMemberActions.SET_AS_MODERATOR,
	RoomMemberActions.INVITE,
	RoomMemberActions.JOIN,
	RoomMemberActions.LEAVE,
];

export class Federation {
	public static actionAllowed(room: IRoom, action: ValueOf<typeof RoomMemberActions>, userId?: IUser['_id']): boolean {
		if (!isRoomFederated(room)) {
			return false;
		}
		if (isDirectMessageRoom(room)) {
			return false;
		}
		if (!userId) {
			return true;
		}

		const isTheOwner = room.u?._id === userId;

		if (isTheOwner) {
			return true;
		}
		const userSubscription = Promise.await(Subscriptions.findOneByRoomIdAndUserId(room._id, userId));
		if (!userSubscription) {
			return true;
		}

		return Boolean(
			(userSubscription.roles?.includes('owner') || userSubscription.roles?.includes('moderator')) &&
				allowedActionsInFederatedRooms.includes(action),
		);
	}

	public static isAFederatedUsername(username: string): boolean {
		return username.includes('@') && username.includes(':');
	}

	public static escapeExternalFederationEventId(externalEventId: string): string {
		return escapeExternalFederationEventId(externalEventId);
	}

	public static unescapeExternalFederationEventId(externalEventId: string): string {
		return unescapeExternalFederationEventId(externalEventId);
	}
}
