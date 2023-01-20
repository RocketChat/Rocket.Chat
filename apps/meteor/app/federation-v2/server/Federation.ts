import type { IRoom, IUser, ValueOf } from '@rocket.chat/core-typings';
import { isRoomFederated, isDirectMessageRoom } from '@rocket.chat/core-typings';
import { Roles, Subscriptions } from '@rocket.chat/models';

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
		console.log({ room });
		console.log({ action });
		console.log({ userId });
		if (!isRoomFederated(room)) {
			return false;
		}
		if (isDirectMessageRoom(room)) {
			return false;
		}
		if (!userId) {
			return true;
		}
		const userSubscription = Promise.await(Subscriptions.findOneByRoomIdAndUserId(room._id, userId));
		if (!userSubscription) {
			return true;
		}
		console.log({ userSubscription });
		const myself = userSubscription.u?._id === userId;
		// console.log({ myself });
		// console.log({ myRoles: userSubscription.roles });

		const showingUserRoles = Promise.await(Roles.findOne({ 'rid': room._id, 'u._id': userId }));
		// console.log({ forShowingUserRoles: showingUserRoles });

		if (action === RoomMemberActions.REMOVE_USER && myself) {
			return false;
		}

		if (userSubscription.roles?.includes('owner')) {
			if (showingUserRoles?.includes('owner')) {
				if (action === RoomMemberActions.SET_AS_OWNER || action === RoomMemberActions.SET_AS_MODERATOR) {
					return myself;
				}
				if (action === RoomMemberActions.REMOVE_USER) {
					return false;
				}
			}

			if (showingUserRoles?.includes('moderator')) {
				if (action === RoomMemberActions.SET_AS_OWNER) {
					return true;
				}
				if (action === RoomMemberActions.SET_AS_MODERATOR) {
					return true;
				}
				return allowedActionsInFederatedRooms.includes(action);
			}

			return allowedActionsInFederatedRooms.includes(action);
		}

		if (userSubscription.roles?.includes('moderator')) {
			if (showingUserRoles?.includes('owner')) {
				return false;
			}

			if (showingUserRoles?.includes('moderator')) {
				if (action === RoomMemberActions.SET_AS_OWNER) {
					return false;
				}
				if (action === RoomMemberActions.SET_AS_MODERATOR) {
					return myself;
				}
				return false;
			}

			return action === RoomMemberActions.SET_AS_MODERATOR || action === RoomMemberActions.REMOVE_USER;
		}
		return false;
		// const isTheOwner = room.u?._id === userId;

		// if (isTheOwner) {
		// 	return false;
		// }
		// const userSubscription = Promise.await(Subscriptions.findOneByRoomIdAndUserId(room._id, userId));
		// if (!userSubscription) {
		// 	return true;
		// }

		// return Boolean(
		// 	(userSubscription.roles?.includes('owner') || userSubscription.roles?.includes('moderator')) &&
		// 		allowedActionsInFederatedRooms.includes(action),
		// );
		// const isTheOwner = room.u?._id === userId;

		// if (isTheOwner) {
		// 	return false;
		// }
		// const userSubscription = Promise.await(Subscriptions.findOneByRoomIdAndUserId(room._id, userId));
		// if (!userSubscription) {
		// 	return true;
		// }

		// return Boolean(
		// 	(userSubscription.roles?.includes('owner') || userSubscription.roles?.includes('moderator')) &&
		// 		allowedActionsInFederatedRooms.includes(action),
		// );
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
