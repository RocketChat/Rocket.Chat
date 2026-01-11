import { FederationMatrix, Authorization, MeteorError, Room } from '@rocket.chat/core-services';
import { isEditedMessage, isRoomNativeFederated, isUserNativeFederated } from '@rocket.chat/core-typings';
import type { IRoomNativeFederated, IMessage, IRoom, IUser } from '@rocket.chat/core-typings';
import { validateFederatedUsername } from '@rocket.chat/federation-matrix';
import { Rooms } from '@rocket.chat/models';

import { callbacks } from '../../../../server/lib/callbacks';
import { afterLeaveRoomCallback } from '../../../../server/lib/callbacks/afterLeaveRoomCallback';
import { afterRemoveFromRoomCallback } from '../../../../server/lib/callbacks/afterRemoveFromRoomCallback';
import { beforeAddUsersToRoom, beforeAddUserToRoom } from '../../../../server/lib/callbacks/beforeAddUserToRoom';
import { beforeChangeRoomRole } from '../../../../server/lib/callbacks/beforeChangeRoomRole';
import { prepareCreateRoomCallback } from '../../../../server/lib/callbacks/beforeCreateRoomCallback';
import { FederationActions } from '../../../../server/services/room/hooks/BeforeFederationActions';

// callbacks.add('federation-event-example', async () => FederationMatrix.handleExample(), callbacks.priority.MEDIUM, 'federation-event-example-handler');

// TODO: move this to the hooks folder

// Called BEFORE subscriptions are created - creates Matrix room so invites can be sent.
// The invites are sent by beforeAddUserToRoom callback.
callbacks.add('federation.afterCreateFederatedRoom', async (room, { owner, originalMemberList: members }) => {
	if (!FederationActions.shouldPerformFederationAction(room)) {
		return;
	}

	const federatedRoomId = room?.federation?.mrid;
	if (!federatedRoomId) {
		await FederationMatrix.createRoom(room, owner);
	} else {
		// TODO unify how to get server
		// matrix room was already created and passed
		const fromServer = federatedRoomId.split(':')[1];

		await Rooms.setAsFederated(room._id, {
			mrid: federatedRoomId,
			origin: fromServer,
		});
	}

	const federationRoom = await Rooms.findOneById(room._id);
	if (!federationRoom || !isRoomNativeFederated(federationRoom)) {
		throw new MeteorError('error-invalid-room', 'Invalid room');
	}

	// TODO this won't be neeeded once we receive all state events at ee/packages/federation-matrix/src/events/member.ts
	await FederationMatrix.inviteUsersToRoom(
		federationRoom,
		members.filter((member) => member !== owner.username),
		owner,
	);
});

callbacks.add(
	'afterSaveMessage',
	async (message, { room, user }) => {
		if (!FederationActions.shouldPerformFederationAction(room)) {
			return;
		}

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
	},
	callbacks.priority.HIGH,
	'native-federation-after-room-message-sent',
);

callbacks.add(
	'afterDeleteMessage',
	async (message: IMessage, { room }) => {
		if (!message.federation?.eventId) {
			return;
		}

		if (FederationActions.shouldPerformFederationAction(room)) {
			await FederationMatrix.deleteMessage(room.federation.mrid, message);
		}
	},
	callbacks.priority.MEDIUM,
	'native-federation-after-delete-message',
);

beforeAddUsersToRoom.add(async ({ usernames, inviter }, room) => {
	if (!FederationActions.shouldPerformFederationAction(room) && inviter) {
		// check if trying to invite a federated user to a non-federated room
		const federatedUsernames = usernames.filter((u) => validateFederatedUsername(u));
		if (federatedUsernames.length > 0) {
			throw new MeteorError('error-federated-users-in-non-federated-rooms', 'Cannot add federated users to non-federated rooms');
		}
		return;
	}

	// we create local users before adding them to the room
	await FederationMatrix.ensureFederatedUsersExistLocally(usernames);
});

beforeAddUserToRoom.add(
	async ({ user, inviter }, room) => {
		if (!user.username || !inviter) {
			return;
		}

		if (!FederationActions.shouldPerformFederationAction(room)) {
			return;
		}

		// TODO should we really check for "user" here? it is potentially an external user
		if (!(await Authorization.hasPermission(user._id, 'access-federation'))) {
			throw new MeteorError('error-not-authorized-federation', 'Not authorized to access federation');
		}

		// If inviter is federated, the invite came from an external transaction.
		// Don't propagate back to Matrix (it was already processed at origin server).
		if (isUserNativeFederated(inviter)) {
			return;
		}

		await FederationMatrix.inviteUsersToRoom(room, [user.username], inviter);

		// after invite is sent we create the invite subscriptions
		// TODO this may be not needed if we receive the emit for the invite event from matrix
		await Room.createUserSubscription({
			ts: new Date(),
			room,
			userToBeAdded: user,
			inviter,
			status: 'INVITED',
		});
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
	async ({ user, kicker }, room: IRoom): Promise<void> => {
		if (FederationActions.shouldPerformFederationAction(room)) {
			await FederationMatrix.leaveRoom(room._id, user, kicker);
		}
	},
	callbacks.priority.HIGH,
	'federation-matrix-after-leave-room',
);

afterRemoveFromRoomCallback.add(
	async (data: { removedUser: IUser; userWhoRemoved: IUser }, room: IRoom): Promise<void> => {
		if (FederationActions.shouldPerformFederationAction(room)) {
			await FederationMatrix.kickUser(room, data.removedUser, data.userWhoRemoved);
		}
	},
	callbacks.priority.HIGH,
	'federation-matrix-after-remove-from-room',
);

callbacks.add(
	'afterRoomNameChange',
	async ({ room, name, user }) => {
		if (FederationActions.shouldPerformFederationAction(room)) {
			await FederationMatrix.updateRoomName(room._id, name, user);
		}
	},
	callbacks.priority.HIGH,
	'federation-matrix-after-room-name-changed',
);

callbacks.add(
	'afterRoomTopicChange',
	async (_, { room, topic, user }) => {
		if (FederationActions.shouldPerformFederationAction(room)) {
			await FederationMatrix.updateRoomTopic(room, topic, user);
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

			await FederationMatrix.updateMessage(room, message);
		}
	},
	callbacks.priority.HIGH,
	'federation-matrix-after-room-message-updated',
);

beforeChangeRoomRole.add(
	async (params: { fromUserId: string; userId: string; room: IRoom; role: 'moderator' | 'owner' | 'leader' | 'user' }) => {
		if (FederationActions.shouldPerformFederationAction(params.room)) {
			await FederationMatrix.addUserRoleRoomScoped(params.room, params.fromUserId, params.userId, params.role);
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

callbacks.add('federation.beforeCreateDirectMessage', async (roomUsers, extraData) => {
	// TODO: use a shared helper to check whether a user is federated
	// since the DM creation API doesn't tell us if the room is federated (unlike normal channels),
	// we're currently inferring it: if any participant has a Matrix-style ID (@user:server), we treat the DM as federated
	const hasFederatedMembers = roomUsers.some((user: unknown) => typeof user === 'string' && user.includes(':') && user.includes('@'));

	if (hasFederatedMembers) {
		extraData.federated = true;
		extraData.federation = {
			version: 1,
		};
	}
});

callbacks.add(
	'afterCreateDirectRoom',
	async (room: IRoom, params: { members: IUser[]; creatorId: IUser['_id'] }): Promise<void> => {
		if (!FederationActions.shouldPerformFederationAction(room)) {
			return;
		}

		// as per federation.beforeCreateDirectMessage we create a DM without federation data because we still don't have it.
		if (!room.federation.mrid) {
			// so after the DM is created we call the federation to create the DM on Matrix side and then updated the reference here
			await FederationMatrix.createDirectMessageRoom(room, params.members, params.creatorId);
		}
	},
	callbacks.priority.HIGH,
	'federation-matrix-after-create-direct-room',
);

prepareCreateRoomCallback.add(async ({ extraData }) => {
	if (!extraData.federated || isRoomNativeFederated(extraData)) {
		return;
	}

	// when we receive extraData.federated, we need to prepare the room to be considered IRoomNativeFederated.
	// according to isRoomNativeFederated for a room to be considered IRoomNativeFederated it is enough to have
	// only an empty "federation" object
	(extraData as IRoomNativeFederated).federation = { version: 1 } as any;
});
