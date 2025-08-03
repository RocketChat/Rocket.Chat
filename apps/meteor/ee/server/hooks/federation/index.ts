import { FederationMatrix } from '@rocket.chat/core-services';
import { isRoomNativeFederated, type IMessage, type IUser } from '@rocket.chat/core-typings';

import { callbacks } from '../../../../lib/callbacks';
import { afterLeaveRoomCallback } from '../../../../lib/callbacks/afterLeaveRoomCallback';
import { afterRemoveFromRoomCallback } from '../../../../lib/callbacks/afterRemoveFromRoomCallback';
import { beforeAddUserToRoom } from '../../../../lib/callbacks/beforeAddUserToRoom';
import { getFederationVersion } from '../../../../server/services/federation/utils';

// callbacks.add('federation-event-example', async () => FederationMatrix.handleExample(), callbacks.priority.MEDIUM, 'federation-event-example-handler');

callbacks.add('federation.afterCreateFederatedRoom', async (room, { owner, originalMemberList: members }) => {
	const federationVersion = getFederationVersion();
	if (federationVersion === 'matrix') {
		await FederationMatrix.createRoom(room, owner, members);
	}
});

callbacks.add(
	'afterSaveMessage',
	async (message, { room, user }) => {
		const shouldBeHandledByFederation = room.federated === true || user.username?.includes(':');
		const federationVersion = getFederationVersion();

		if (shouldBeHandledByFederation && federationVersion === 'native') {
			try {
				// TODO: Check if message already exists in the database, if it does, don't send it to the federation to avoid loops
				// If message is federated, it will save external_message_id like into the message object
				// if this prop exists here it should not be sent to the federation to avoid loops
				if (!message.federation?.eventId) {
					await FederationMatrix.sendMessage(message, room, user);
				}
			} catch (error) {
				// Log the error but don't prevent the message from being sent locally
				console.error('[sendMessage] Failed to send message to Native Federation:', error);
			}
		}
	},
	callbacks.priority.HIGH,
	'federation-v2-after-room-message-sent',
);
callbacks.add(
	'federation.onAddUsersToRoom',
	async ({ invitees, inviter }, room) => FederationMatrix.inviteUsersToRoom(room, invitees, inviter),
	callbacks.priority.MEDIUM,
	'native-federation-on-add-users-to-room ',
);

beforeAddUserToRoom.add(
	async ({ user, inviter }, room) => {
		if (!user.username || !inviter) {
			return;
		}
		if (!isRoomNativeFederated(room)) {
			return;
		}
		await FederationMatrix.inviteUsersToRoom(room, [user.username], inviter);
	},
	callbacks.priority.MEDIUM,
	'native-federation-on-before-add-users-to-room ',
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
