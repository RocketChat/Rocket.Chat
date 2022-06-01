import type { MatrixProfileInfo } from '@rocket.chat/forked-matrix-bot-sdk';
import { IUser } from '@rocket.chat/core-typings';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { matrixBridge } from '../bridge';
import { MatrixBridgedUser, MatrixBridgedRoom, Users } from '../../../models/server';
import { addUserToRoom } from '../../../lib/server/functions';
import { matrixClient } from '.';
import { dataInterface } from '../data-interface';
import { settings } from '../../../settings/server';
import { api } from '../../../../server/sdk/api';

interface ICreateUserResult {
	uid: string;
	mui: string;
	remote: boolean;
}

const removeUselessCharsFromMatrixId = (matrixUserId = ''): string => matrixUserId.replace('@', '');
const formatUserIdAsRCUsername = (userId = ''): string => removeUselessCharsFromMatrixId(userId.split(':')[0]);

export const invite = async (inviterId: string, roomId: string, invitedId: string): Promise<void> => {
	console.log(`[${inviterId}-${invitedId}-${roomId}] Inviting user ${invitedId} to ${roomId}...`);

	// Find the inviter user
	let bridgedInviterUser = MatrixBridgedUser.getById(inviterId);
	// Get the user
	const inviterUser = await dataInterface.user(inviterId);

	// Determine if the user is local or remote
	let invitedUserMatrixId = invitedId;
	const invitedUserDomain = invitedId.includes(':') ? invitedId.split(':').pop() : '';
	const invitedUserIsRemote = invitedUserDomain && invitedUserDomain !== settings.get('Federation_Matrix_homeserver_domain');

	// Find the invited user in Rocket.Chats users
	// TODO: this should be refactored asap, since these variable value changes lead us to confusion
	let invitedUser = Users.findOneByUsername(removeUselessCharsFromMatrixId(invitedId));

	if (!invitedUser) {
		// Create the invited user
		const { uid } = await matrixClient.user.createLocal(invitedUserMatrixId);
		invitedUser = Users.findOneById(uid);
	}

	// The inviters user doesn't yet exist in matrix
	if (!bridgedInviterUser) {
		console.log(`[${inviterId}-${invitedId}-${roomId}] Creating remote inviter user...`);

		// Create the missing user
		bridgedInviterUser = await matrixClient.user.createRemote(inviterUser);

		console.log(`[${inviterId}-${invitedId}-${roomId}] Inviter user created as ${bridgedInviterUser.mui}...`);
	}

	// Find the bridged room id
	let matrixRoomId = await MatrixBridgedRoom.getMatrixId(roomId);

	// Get the room
	const room = await dataInterface.room(roomId);

	if (!matrixRoomId) {
		console.log(`[${inviterId}-${invitedId}-${roomId}] Creating remote room...`);

		// Create the missing room
		const { mri } = await matrixClient.room.create({ _id: inviterId } as IUser, room, invitedId);

		matrixRoomId = mri;

		console.log(`[${inviterId}-${invitedId}-${roomId}] Remote room created as ${matrixRoomId}...`);
	}

	// If the invited user is not remote, let's ensure it exists remotely
	if (!invitedUserIsRemote) {
		console.log(`[${inviterId}-${invitedId}-${roomId}] Creating remote invited user...`);

		// Check if we already have a matrix id for that user
		const existingMatrixId = MatrixBridgedUser.getMatrixId(invitedUser._id);

		if (!existingMatrixId) {
			const { mui } = await matrixClient.user.createRemote(invitedUser);

			invitedUserMatrixId = mui;
		} else {
			invitedUserMatrixId = existingMatrixId;
		}

		console.log(`[${inviterId}-${invitedId}-${roomId}] Invited user created as ${invitedUserMatrixId}...`);
	}

	console.log(`[${inviterId}-${invitedId}-${roomId}] Inviting the user to the room...`);
	// Invite && Auto-join if the user is Rocket.Chat controlled
	if (!invitedUserIsRemote) {
		// Invite the user to the room
		await matrixBridge.getInstance().getIntent(bridgedInviterUser.mui).invite(matrixRoomId, invitedUserMatrixId);

		console.log(`[${inviterId}-${invitedId}-${roomId}] Auto-join room...`);

		await matrixBridge.getInstance().getIntent(invitedUserMatrixId).join(matrixRoomId);
	} else if (room.t !== 'd') {
		// Invite the user to the room but don't wait as this is dependent on the user accepting the invite because we don't control this user
		matrixBridge
			.getInstance()
			.getIntent(bridgedInviterUser.mui)
			.invite(matrixRoomId, invitedUserMatrixId)
			.catch(() => {
				api.broadcast('notify.ephemeralMessage', inviterId, roomId, {
					msg: TAPi18n.__('Federation_Matrix_only_owners_can_invite_users', {
						postProcess: 'sprintf',
						lng: settings.get('Language') || 'en',
					}),
				});
			});
	}

	// Add the matrix user to the invited room
	addUserToRoom(roomId, invitedUser, inviterUser, false);
};

export const createRemote = async (u: IUser): Promise<ICreateUserResult> => {
	const matrixUserId = `@${u.username?.toLowerCase()}:${settings.get('Federation_Matrix_homeserver_domain')}`;

	console.log(`Creating remote user ${matrixUserId}...`);

	const intent = matrixBridge.getInstance().getIntent(matrixUserId);

	await intent.ensureProfile(u.name);

	await intent.setDisplayName(`${u.username} (${u.name})`);

	const payload = { uid: u._id, mui: matrixUserId, remote: true };

	MatrixBridgedUser.upsert({ uid: u._id }, payload);

	return payload;
};

const createLocalUserIfNotExists = async (userId = '', profileInfo: MatrixProfileInfo = {}): Promise<string> => {
	const existingUser = await Users.findOneByUsername(formatUserIdAsRCUsername(userId));

	if (existingUser) {
		return existingUser._id;
	}

	return Users.create({
		username: removeUselessCharsFromMatrixId(userId),
		type: 'user',
		status: 'online',
		active: true,
		roles: ['user'],
		name: profileInfo.displayname,
		requirePasswordChange: false,
	});
};

export const createLocal = async (matrixUserId: string): Promise<ICreateUserResult> => {
	console.log(`Creating local user ${matrixUserId}...`);

	const intent = matrixBridge.getInstance().getIntent(matrixUserId);

	let currentProfile: MatrixProfileInfo = {};

	try {
		currentProfile = await intent.getProfileInfo(matrixUserId);
	} catch (err) {
		// no-op
	}

	const uid = await createLocalUserIfNotExists(matrixUserId, currentProfile);
	const payload = { uid, mui: matrixUserId, remote: false };

	MatrixBridgedUser.upsert({ uid }, payload);

	return payload;
};
