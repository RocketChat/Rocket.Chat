import { ServiceClassInternal, Authorization, MeteorError } from '@rocket.chat/core-services';
import type { ICreateRoomParams, IRoomService } from '@rocket.chat/core-services';
import { type AtLeast, type IRoom, type IUser, isOmnichannelRoom, isRoomWithJoinCode } from '@rocket.chat/core-typings';
import { Rooms, Users } from '@rocket.chat/models';

import { FederationActions } from './hooks/BeforeFederationActions';
import { saveRoomTopic } from '../../../app/channel-settings/server/functions/saveRoomTopic';
import { addUserToRoom } from '../../../app/lib/server/functions/addUserToRoom';
import { createRoom } from '../../../app/lib/server/functions/createRoom'; // TODO remove this import
import { removeUserFromRoom } from '../../../app/lib/server/functions/removeUserFromRoom';
import { getValidRoomName } from '../../../app/utils/server/lib/getValidRoomName';
import { RoomMemberActions } from '../../../definition/IRoomTypeConfig';
import { roomCoordinator } from '../../lib/rooms/roomCoordinator';
import { createDirectMessage } from '../../methods/createDirectMessage';

export class RoomService extends ServiceClassInternal implements IRoomService {
	protected name = 'room';

	async create(uid: string, params: ICreateRoomParams): Promise<IRoom> {
		const { type, name, members = [], readOnly, extraData, options, sidepanel } = params;

		const hasPermission = await Authorization.hasPermission(uid, `create-${type}`);
		if (!hasPermission) {
			throw new Error('no-permission');
		}

		const user = await Users.findOneById(uid);
		if (!user?.username) {
			throw new Error('User not found');
		}

		// TODO convert `createRoom` function to "raw" and move to here
		return createRoom(type, name, user, members, false, readOnly, extraData, options, sidepanel) as unknown as IRoom;
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
		user: Pick<IUser, '_id'> | string,
		inviter?: Pick<IUser, '_id' | 'username'>,
		options?: {
			skipSystemMessage?: boolean;
			skipAlertSound?: boolean;
		},
	): Promise<boolean | undefined> {
		return addUserToRoom(roomId, user, inviter, options);
	}

	async removeUserFromRoom(roomId: string, user: IUser, options?: { byUser: IUser }): Promise<void> {
		return removeUserFromRoom(roomId, user, options);
	}

	async getValidRoomName(displayName: string, roomId = '', options: { allowDuplicates?: boolean } = {}): Promise<string> {
		return getValidRoomName(displayName, roomId, options);
	}

	async saveRoomTopic(
		roomId: string,
		roomTopic: string | undefined,
		user: {
			username: string;
			_id: string;
		},
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
}
