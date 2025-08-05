import { api, FederationMatrix } from '@rocket.chat/core-services';
import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';
import { Messages, Rooms } from '@rocket.chat/models';

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
		const isEchoMessage = !(await Messages.findOneByFederationId(message.federation?.eventId));
		if (isEchoMessage) {
			return;
		}
		await FederationMatrix.deleteMessage(message);
	},
	callbacks.priority.MEDIUM,
	'native-federation-after-delete-message',
);

callbacks.add(
	'native-federation.onAddUsersToRoom',
	async ({ invitees, inviter }, room) => FederationMatrix.inviteUsersToRoom(room, invitees, inviter),
	callbacks.priority.MEDIUM,
	'native-federation-on-add-users-to-room ',
);

callbacks.add(
	'native-federation.onAfterAddUsersToRoom',
	async ({ invitees, inviter }, room) => FederationMatrix.inviteUsersToRoom(room, invitees, inviter),
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
