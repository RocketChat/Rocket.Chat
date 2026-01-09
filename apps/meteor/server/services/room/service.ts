import { ServiceClassInternal, Authorization, Message, MeteorError } from '@rocket.chat/core-services';
import type { ICreateRoomParams, IRoomService } from '@rocket.chat/core-services';
import {
	type AtLeast,
	type IRoom,
	type IUser,
	type MessageTypesValues,
	type ISubscription,
	isOmnichannelRoom,
	isRoomWithJoinCode,
} from '@rocket.chat/core-typings';
import { Rooms, Subscriptions, Users } from '@rocket.chat/models';

import { getNameForDMs } from './getNameForDMs';
import { FederationActions } from './hooks/BeforeFederationActions';
import { saveRoomName } from '../../../app/channel-settings/server';
import { saveRoomTopic } from '../../../app/channel-settings/server/functions/saveRoomTopic';
import { performAcceptRoomInvite } from '../../../app/lib/server/functions/acceptRoomInvite';
import { addUserToRoom } from '../../../app/lib/server/functions/addUserToRoom';
import { createRoom } from '../../../app/lib/server/functions/createRoom'; // TODO remove this import
import { removeUserFromRoom, performUserRemoval } from '../../../app/lib/server/functions/removeUserFromRoom';
import { notifyOnSubscriptionChangedById, notifyOnSubscriptionChangedByRoomIdAndUserId } from '../../../app/lib/server/lib/notifyListener';
import { getDefaultSubscriptionPref } from '../../../app/utils/lib/getDefaultSubscriptionPref';
import { getValidRoomName } from '../../../app/utils/server/lib/getValidRoomName';
import { RoomMemberActions } from '../../../definition/IRoomTypeConfig';
import { getSubscriptionAutotranslateDefaultConfig } from '../../lib/getSubscriptionAutotranslateDefaultConfig';
import { roomCoordinator } from '../../lib/rooms/roomCoordinator';
import { addRoomLeader } from '../../methods/addRoomLeader';
import { addRoomModerator } from '../../methods/addRoomModerator';
import { addRoomOwner } from '../../methods/addRoomOwner';
import { createDirectMessage } from '../../methods/createDirectMessage';
import { removeRoomLeader } from '../../methods/removeRoomLeader';
import { removeRoomModerator } from '../../methods/removeRoomModerator';
import { removeRoomOwner } from '../../methods/removeRoomOwner';

export class RoomService extends ServiceClassInternal implements IRoomService {
	protected name = 'room';

	async updateDirectMessageRoomName(room: IRoom, ignoreStatusFromSubs?: string[]): Promise<boolean> {
		const subs = await Subscriptions.findByRoomId(room._id, { projection: { u: 1, status: 1 } }).toArray();

		const uids = subs.map((sub) => sub.u._id);

		const roomMembers = await Users.findUsersByIds(uids, { projection: { name: 1, username: 1 } }).toArray();

		const roomNames = getNameForDMs(roomMembers);

		for await (const sub of subs) {
			// don't update the name if the user is invited but hasn't accepted yet
			if (!ignoreStatusFromSubs?.includes(sub._id) && sub.status === 'INVITED') {
				continue;
			}
			await Subscriptions.updateOne({ _id: sub._id }, { $set: roomNames[sub.u._id] });

			void notifyOnSubscriptionChangedByRoomIdAndUserId(room._id, sub.u._id, 'updated');
		}

		return true;
	}

	async create(uid: string, params: ICreateRoomParams): Promise<IRoom> {
		const { type, name, members = [], readOnly, extraData, options } = params;

		const hasPermission = await Authorization.hasPermission(uid, `create-${type}`);
		if (!hasPermission) {
			throw new Error('no-permission');
		}

		const user = await Users.findOneById(uid);
		if (!user?.username) {
			throw new Error('User not found');
		}

		// TODO convert `createRoom` function to "raw" and move to here
		return createRoom(type, name, user, members, false, readOnly, extraData, options) as unknown as IRoom;
	}

	async createDirectMessage({ to, from }: { to: string; from: string }): Promise<{ rid: string }> {
		const [toUser, fromUser] = await Promise.all([
			Users.findOneById(to, { projection: { username: 1 } }),
			Users.findOneById(from, { projection: { _id: 1 } }),
		]);

		if (!toUser?.username || !fromUser) {
			throw new Error('error-invalid-user');
		}
		return this.createDirectMessageWithMultipleUsers([toUser.username], fromUser._id);
	}

	async createDirectMessageWithMultipleUsers(members: string[], creatorId: string): Promise<{ rid: string }> {
		return createDirectMessage(members, creatorId);
	}

	async addMember(uid: string, rid: string): Promise<boolean> {
		const hasPermission = await Authorization.hasPermission(uid, 'add-user-to-joined-room', rid);
		if (!hasPermission) {
			throw new Error('no-permission');
		}

		return true;
	}

	async addUserToRoom(
		roomId: string,
		user: Pick<IUser, '_id'>,
		inviter?: Pick<IUser, '_id' | 'username'>,
		options?: {
			skipSystemMessage?: boolean;
			skipAlertSound?: boolean;
		},
	): Promise<boolean | undefined> {
		return addUserToRoom(roomId, user, inviter, options);
	}

	async removeUserFromRoom(
		roomId: string,
		user: IUser,
		options?: { byUser?: IUser; skipAppPreEvents?: boolean; customSystemMessage?: MessageTypesValues },
	): Promise<void> {
		return removeUserFromRoom(roomId, user, options);
	}

	async performUserRemoval(room: IRoom, user: IUser, options?: { byUser?: IUser }): Promise<void> {
		return performUserRemoval(room, user, options);
	}

	async performAcceptRoomInvite(room: IRoom, subscription: ISubscription, user: IUser & { username: string }): Promise<void> {
		return performAcceptRoomInvite(room, subscription, user);
	}

	async getValidRoomName(displayName: string, roomId = '', options: { allowDuplicates?: boolean } = {}): Promise<string> {
		return getValidRoomName(displayName, roomId, options);
	}

	async saveRoomTopic(
		roomId: string,
		roomTopic: string | undefined,
		user: Pick<IUser, 'username' | '_id' | 'federation' | 'federated'>,
		sendMessage = true,
	): Promise<void> {
		await saveRoomTopic(roomId, roomTopic, user, sendMessage);
	}

	async getRouteLink(room: AtLeast<IRoom, '_id' | 't' | 'name'>): Promise<string | boolean> {
		return roomCoordinator.getRouteLink(room.t as string, { rid: room._id, name: room.name });
	}

	/**
	 * Method called by users to join a room.
	 */
	async join({ room, user, joinCode }: { room: IRoom; user: Pick<IUser, '_id'>; joinCode?: string }) {
		if (!(await roomCoordinator.getRoomDirectives(room.t)?.allowMemberAction(room, RoomMemberActions.JOIN, user._id))) {
			throw new MeteorError('error-not-allowed', 'Not allowed', { method: 'joinRoom' });
		}

		if (isOmnichannelRoom(room) && !room.open) {
			throw new MeteorError('room-closed', 'Room is closed', { method: 'joinRoom' });
		}

		if (!(await Authorization.canAccessRoom(room, user))) {
			throw new MeteorError('error-not-allowed', 'Not allowed', { method: 'joinRoom' });
		}

		if (FederationActions.shouldPerformFederationAction(room) && !(await Authorization.hasPermission(user._id, 'access-federation'))) {
			throw new MeteorError('error-not-authorized-federation', 'Not authorized to access federation', { method: 'joinRoom' });
		}

		if (isRoomWithJoinCode(room) && !(await Authorization.hasPermission(user._id, 'join-without-join-code'))) {
			if (!joinCode) {
				throw new MeteorError('error-code-required', 'Code required', { method: 'joinRoom' });
			}

			const isCorrectJoinCode = !!(await Rooms.findOneByJoinCodeAndId(joinCode, room._id, {
				projection: { _id: 1 },
			}));

			if (!isCorrectJoinCode) {
				throw new MeteorError('error-code-invalid', 'Invalid code', { method: 'joinRoom' });
			}
		}

		return addUserToRoom(room._id, user);
	}

	async beforeLeave(room: IRoom): Promise<void> {
		FederationActions.blockIfRoomFederatedButServiceNotReady(room);
	}

	async beforeUserRemoved(room: IRoom): Promise<void> {
		FederationActions.blockIfRoomFederatedButServiceNotReady(room);
	}

	async beforeNameChange(room: IRoom): Promise<void> {
		FederationActions.blockIfRoomFederatedButServiceNotReady(room);
	}

	async beforeTopicChange(room: IRoom): Promise<void> {
		FederationActions.blockIfRoomFederatedButServiceNotReady(room);
	}

	async saveRoomName(roomId: string, userId: string, name: string) {
		const user = await Users.findOneById(userId);
		if (!user) {
			throw new Error('User not found');
		}
		await saveRoomName(roomId, name, user);
	}

	public async addUserRoleRoomScoped(
		fromUserId: string,
		userId: string,
		roomId: string,
		role: 'moderator' | 'owner' | 'leader' | 'user',
	): Promise<void> {
		if (role === 'moderator') {
			await addRoomModerator(fromUserId, roomId, userId);
			return;
		}

		if (role === 'owner') {
			await addRoomOwner(fromUserId, roomId, userId);
			return;
		}

		if (role === 'leader') {
			await addRoomLeader(fromUserId, roomId, userId);
			return;
		}

		const sub = await Subscriptions.findByUserIdAndRoomIds(userId, [roomId], { projection: { roles: 1 } }).next();
		if (!sub) {
			throw new Error('user and room subsciption not found');
		}

		if (!sub.roles) {
			return; // 'user' role essentially
		}

		for await (const currentRole of sub.roles) {
			if (currentRole === 'owner') {
				await removeRoomOwner(fromUserId, roomId, userId);
				return;
			}

			if (currentRole === 'leader') {
				await removeRoomLeader(fromUserId, roomId, userId);
				return;
			}

			if (currentRole === 'moderator') {
				await removeRoomModerator(fromUserId, roomId, userId);
				return;
			}
		}
	}

	async createUserSubscription({
		room,
		ts,
		userToBeAdded,
		inviter,
		createAsHidden = false,
		skipAlertSound = false,
		skipSystemMessage = false,
		status,
		roles,
	}: {
		room: IRoom;
		ts: Date;
		userToBeAdded: IUser;
		inviter?: Pick<IUser, '_id' | 'username' | 'name'>;
		createAsHidden?: boolean;
		skipAlertSound?: boolean;
		skipSystemMessage?: boolean;
		status?: 'INVITED';
		roles?: ISubscription['roles'];
	}): Promise<string | undefined> {
		const autoTranslateConfig = getSubscriptionAutotranslateDefaultConfig(userToBeAdded);

		const { insertedId } = await Subscriptions.createWithRoomAndUser(room, userToBeAdded, {
			ts,
			open: !createAsHidden,
			alert: createAsHidden ? false : !skipAlertSound,
			unread: 1,
			userMentions: 1,
			groupMentions: 0,
			...(roles && { roles }),
			...(status && { status }),
			...(inviter && { inviter: { _id: inviter._id, username: inviter.username!, name: inviter.name } }),
			...autoTranslateConfig,
			...getDefaultSubscriptionPref(userToBeAdded),
			...(room.t === 'd' && inviter && { fname: inviter.name, name: inviter.username }),
		});

		if (insertedId) {
			void notifyOnSubscriptionChangedById(insertedId, 'inserted');
		}

		if (!skipSystemMessage && userToBeAdded.username) {
			if (inviter) {
				const extraData = {
					ts,
					u: {
						_id: inviter._id,
						username: inviter.username,
					},
				};
				if (room.teamMain) {
					await Message.saveSystemMessage('added-user-to-team', room._id, userToBeAdded.username, userToBeAdded, extraData);
				} else if (status === 'INVITED') {
					await Message.saveSystemMessage('ui', room._id, userToBeAdded.username, userToBeAdded, {
						u: { _id: inviter._id, username: inviter.username },
					});
				} else {
					await Message.saveSystemMessage('au', room._id, userToBeAdded.username, userToBeAdded, extraData);
				}
			} else if (room.prid) {
				await Message.saveSystemMessage('ut', room._id, userToBeAdded.username, userToBeAdded, { ts });
			} else if (room.teamMain) {
				await Message.saveSystemMessage('ujt', room._id, userToBeAdded.username, userToBeAdded, { ts });
			} else {
				await Message.saveSystemMessage('uj', room._id, userToBeAdded.username, userToBeAdded, { ts });
			}
		}

		return insertedId;
	}
}
