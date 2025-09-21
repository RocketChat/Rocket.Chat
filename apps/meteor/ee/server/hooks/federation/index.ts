import { api, FederationMatrix } from '@rocket.chat/core-services';
import { isEditedMessage, type IMessage, type IRoom, type IUser } from '@rocket.chat/core-typings';
import { MatrixBridgedRoom, Rooms } from '@rocket.chat/models';

import notifications from '../../../../app/notifications/server/lib/Notifications';
import { callbacks } from '../../../../lib/callbacks';
import { afterLeaveRoomCallback } from '../../../../lib/callbacks/afterLeaveRoomCallback';
import { afterRemoveFromRoomCallback } from '../../../../lib/callbacks/afterRemoveFromRoomCallback';
import { beforeAddUserToRoom } from '../../../../lib/callbacks/beforeAddUserToRoom';
import { beforeChangeRoomRole } from '../../../../lib/callbacks/beforeChangeRoomRole';
import { FederationActions } from '../../../../server/services/room/hooks/BeforeFederationActions';

// callbacks.add('federation-event-example', async () => FederationMatrix.handleExample(), callbacks.priority.MEDIUM, 'federation-event-example-handler');

// TODO: move this to the hooks folder
callbacks.add('federation.afterCreateFederatedRoom', async (room, { owner, originalMemberList: members, options }) => {
	if (FederationActions.shouldPerformFederationAction(room)) {
		const federatedRoomId = options?.federatedRoomId;
		// TODO: move this to the hooks folder
		setupTypingEventListenerForRoom(room._id);

		if (!federatedRoomId) {
			// if room if exists, we don't want to create it again
			// adds bridge record
			await FederationMatrix.createRoom(room, owner, members);
		} else {
			// matrix room was already created and passed
			const fromServer = federatedRoomId.split(':')[1];
			await MatrixBridgedRoom.createOrUpdateByLocalRoomId(room._id, federatedRoomId, fromServer);
		}

		await Rooms.setAsFederated(room._id);
	}
});

callbacks.add(
	'afterSaveMessage',
	async (message, { room, user }) => {
		if (FederationActions.shouldPerformFederationAction(room)) {
			const shouldBeHandledByFederation = room.federated === true || user.username?.includes(':');

			if (shouldBeHandledByFederation) {
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
		}
	},
	callbacks.priority.HIGH,
	'federation-v2-after-room-message-sent',
);
callbacks.add(
	'afterDeleteMessage',
	async (message: IMessage, room) => {
		if (!message.federation?.eventId) {
			return;
		}

		const isFromExternalUser = message.u?.username?.includes(':');
		if (isFromExternalUser) {
			return;
		}

		if (FederationActions.shouldPerformFederationAction(room)) {
			await FederationMatrix.deleteMessage(message);
		}
	},
	callbacks.priority.MEDIUM,
	'native-federation-after-delete-message',
);

callbacks.add(
	'federation.onAddUsersToRoom',
	async ({ invitees, inviter }, room) => {
		if (FederationActions.shouldPerformFederationAction(room)) {
			await FederationMatrix.inviteUsersToRoom(
				room,
				invitees.map((invitee) => (typeof invitee === 'string' ? invitee : (invitee.username as string))),
				inviter,
			);
		}
	},
	callbacks.priority.MEDIUM,
	'native-federation-on-add-users-to-room ',
);

beforeAddUserToRoom.add(
	async ({ user, inviter }, room) => {
		if (!user.username || !inviter) {
			return;
		}

		if (FederationActions.shouldPerformFederationAction(room)) {
			await FederationMatrix.inviteUsersToRoom(room, [user.username], inviter);
		}
	},
	callbacks.priority.MEDIUM,
	'native-federation-on-before-add-users-to-room',
);

callbacks.add(
	'afterSetReaction',
	async (message: IMessage, params): Promise<void> => {
		// Don't federate reactions that came from Matrix
		if (params.user.username?.includes(':')) {
			return;
		}
		if (FederationActions.shouldPerformFederationAction(params.room)) {
			await FederationMatrix.sendReaction(message._id, params.reaction, params.user);
		}
	},
	callbacks.priority.HIGH,
	'federation-matrix-after-set-reaction',
);

callbacks.add(
	'afterUnsetReaction',
	async (_message: IMessage, params): Promise<void> => {
		// Don't federate reactions that came from Matrix
		if (params.user.username?.includes(':')) {
			return;
		}
		if (FederationActions.shouldPerformFederationAction(params.room)) {
			await FederationMatrix.removeReaction(params.oldMessage._id, params.reaction, params.user, params.oldMessage);
		}
	},
	callbacks.priority.HIGH,
	'federation-matrix-after-unset-reaction',
);

afterLeaveRoomCallback.add(
	async (user: IUser, room: IRoom): Promise<void> => {
		if (FederationActions.shouldPerformFederationAction(room)) {
			await FederationMatrix.leaveRoom(room._id, user);
		}
	},
	callbacks.priority.HIGH,
	'federation-matrix-after-leave-room',
);

afterRemoveFromRoomCallback.add(
	async (data: { removedUser: IUser; userWhoRemoved: IUser }, room: IRoom): Promise<void> => {
		if (FederationActions.shouldPerformFederationAction(room)) {
			await FederationMatrix.kickUser(room._id, data.removedUser, data.userWhoRemoved);
		}
	},
	callbacks.priority.HIGH,
	'federation-matrix-after-remove-from-room',
);

callbacks.add(
	'afterRoomNameChange',
	async ({ room, name, userId }) => {
		if (FederationActions.shouldPerformFederationAction(room)) {
			await FederationMatrix.updateRoomName(room._id, name, userId);
		}
	},
	callbacks.priority.HIGH,
	'federation-matrix-after-room-name-changed',
);

callbacks.add(
	'afterRoomTopicChange',
	async (_, { room, topic, userId }) => {
		if (FederationActions.shouldPerformFederationAction(room)) {
			await FederationMatrix.updateRoomTopic(room._id, topic, userId);
		}
	},
	callbacks.priority.HIGH,
	'federation-matrix-after-room-topic-changed',
);

callbacks.add(
	'afterSaveMessage',
	async (message: IMessage, { room }) => {
		if (FederationActions.shouldPerformFederationAction(room)) {
			if (!isEditedMessage(message)) {
				return;
			}
			FederationActions.shouldPerformFederationAction(room);

			await FederationMatrix.updateMessage(message._id, message.msg, message.u);
		}
	},
	callbacks.priority.HIGH,
	'federation-matrix-after-room-message-updated',
);

beforeChangeRoomRole.add(
	async (params: { fromUserId: string; userId: string; room: IRoom; role: 'moderator' | 'owner' | 'leader' | 'user' }) => {
		if (FederationActions.shouldPerformFederationAction(params.room)) {
			await FederationMatrix.addUserRoleRoomScoped(params.room._id, params.fromUserId, params.userId, params.role);
		}
	},
	callbacks.priority.HIGH,
	'federation-matrix-before-change-room-role',
);

callbacks.add(
	'beforeCreateDirectRoom',
	async (members, room): Promise<void> => {
		if (FederationActions.shouldPerformFederationAction(room)) {
			await FederationMatrix.ensureFederatedUsersExistLocally(members);
		}
	},
	callbacks.priority.HIGH,
	'federation-matrix-before-create-direct-room',
);

callbacks.add(
	'afterCreateDirectRoom',
	async (room: IRoom, params: { members: IUser[]; creatorId: IUser['_id'] }): Promise<void> => {
		if (FederationActions.shouldPerformFederationAction(room)) {
			await FederationMatrix.createDirectMessageRoom(room, params.members, params.creatorId);
		}
	},
	callbacks.priority.HIGH,
	'federation-matrix-after-create-direct-room',
);

// TODO: THIS IS NOT READY FOR PRODUCTION! IMPOSSIBLE TO ADD ONE LISTENER PER ROOM!
const setupTypingEventListenerForRoom = (roomId: string): void => {
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
