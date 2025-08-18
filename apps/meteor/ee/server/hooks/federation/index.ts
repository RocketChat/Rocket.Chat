import { api, FederationMatrix } from '@rocket.chat/core-services';
import {
	isEditedMessage,
	isMessageFromMatrixFederation,
	isRoomFederated,
	type IMessage,
	type IRoom,
	type IUser,
} from '@rocket.chat/core-typings';
import { Rooms } from '@rocket.chat/models';

import notifications from '../../../../app/notifications/server/lib/Notifications';
import { callbacks } from '../../../../lib/callbacks';
import { afterLeaveRoomCallback } from '../../../../lib/callbacks/afterLeaveRoomCallback';
import { afterRemoveFromRoomCallback } from '../../../../lib/callbacks/afterRemoveFromRoomCallback';

callbacks.add(
	'afterDeleteMessage',
	async (message: IMessage) => {
		if (!message.federation?.eventId) {
			return;
		}

		const isFromExternalUser = message.u?.username?.includes(':');
		if (isFromExternalUser) {
			return;
		}

		await FederationMatrix.deleteMessage(message);
	},
	callbacks.priority.MEDIUM,
	'native-federation-after-delete-message',
);

callbacks.add(
	'native-federation.onAddUsersToRoom',
	async ({ invitees, inviter }, room) =>
		FederationMatrix.inviteUsersToRoom(
			room,
			invitees.map((invitee) => (typeof invitee === 'string' ? invitee : (invitee.username as string))),
			inviter,
		),
	callbacks.priority.MEDIUM,
	'native-federation-on-add-users-to-room ',
);

callbacks.add(
	'native-federation.onAfterAddUsersToRoom',
	async ({ invitees, inviter }, room) =>
		FederationMatrix.inviteUsersToRoom(
			room,
			invitees.map((invitee) => (typeof invitee === 'string' ? invitee : (invitee.username as string))),
			inviter,
		),
	callbacks.priority.MEDIUM,
	'native-federation-on-after-add-users-to-room ',
);

callbacks.add(
	'afterSetReaction',
	async (message: IMessage, params: { user: IUser; reaction: string }): Promise<void> => {
		// Don't federate reactions that came from Matrix
		if (params.user.username?.includes(':')) {
			return;
		}
		await FederationMatrix.sendReaction(message._id, params.reaction, params.user);
	},
	callbacks.priority.HIGH,
	'federation-matrix-after-set-reaction',
);

callbacks.add(
	'afterUnsetReaction',
	async (_message: IMessage, params: { user: IUser; reaction: string; oldMessage: IMessage }): Promise<void> => {
		// Don't federate reactions that came from Matrix
		if (params.user.username?.includes(':')) {
			return;
		}
		await FederationMatrix.removeReaction(params.oldMessage._id, params.reaction, params.user, params.oldMessage);
	},
	callbacks.priority.HIGH,
	'federation-matrix-after-unset-reaction',
);

afterLeaveRoomCallback.add(
	async (user: IUser, room: IRoom): Promise<void> => {
		if (!room.federated) {
			return;
		}

		await FederationMatrix.leaveRoom(room._id, user);
	},
	callbacks.priority.HIGH,
	'federation-matrix-after-leave-room',
);

afterRemoveFromRoomCallback.add(
	async (data: { removedUser: IUser; userWhoRemoved: IUser }, room: IRoom): Promise<void> => {
		if (!room.federated) {
			return;
		}

		await FederationMatrix.kickUser(room._id, data.removedUser, data.userWhoRemoved);
	},
	callbacks.priority.HIGH,
	'federation-matrix-after-remove-from-room',
);

callbacks.add(
	'afterSaveMessage',
	async (message: IMessage, { room }): Promise<IMessage> => {
		if (!room || !isRoomFederated(room) || !message || !isMessageFromMatrixFederation(message)) {
			return message;
		}

		if (!isEditedMessage(message)) {
			return message;
		}

		await FederationMatrix.updateMessage(message._id, message.msg, message.u);
		return message;
	},
	callbacks.priority.HIGH,
	'federation-matrix-after-room-message-updated',
);

callbacks.add(
	'beforeChangeRoomRole',
	async (params: { fromUserId: string; userId: string; roomId: string; role: 'moderator' | 'owner' | 'leader' | 'user' }) => {
		await FederationMatrix.addUserRoleRoomScoped(params.roomId, params.fromUserId, params.userId, params.role);
	},
	callbacks.priority.HIGH,
	'federation-matrix-before-change-room-role',
);

export const setupTypingEventListenerForRoom = (roomId: string): void => {
	notifications.streamRoom.on(`${roomId}/user-activity`, (username, activity) => {
		if (Array.isArray(activity) && (!activity.length || activity.includes('user-typing'))) {
			void api.broadcast('user.typing', {
				user: { username },
				isTyping: activity.includes('user-typing'),
				roomId,
			});
		}
	});
};

export const setupInternalEDUEventListeners = async () => {
	const federatedRooms = await Rooms.findFederatedRooms({ projection: { _id: 1 } }).toArray();
	for (const room of federatedRooms) {
		setupTypingEventListenerForRoom(room._id);
	}
};
