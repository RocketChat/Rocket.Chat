import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';
import { ServiceClassInternal, Authorization } from '@rocket.chat/core-services';
import type { ICreateRoomParams, IRoomService, ICreateDiscussionParams } from '@rocket.chat/core-services';

import { createRoom, addUserToRoom as meteorAddUserToRoom } from '../../../app/lib/server/functions'; // TODO remove this import
import { create as createDiscussion } from '../../../app/discussion/server/methods/createDiscussion';
import { createDirectMessage } from '../../methods/createDirectMessage';

export class RoomService extends ServiceClassInternal implements IRoomService {
	protected name = 'room';

	async create(uid: string, params: ICreateRoomParams): Promise<IRoom> {
		const { type, name, members = [], readOnly, extraData, options } = params;

		const hasPermission = await Authorization.hasPermission(uid, `create-${type}`);
		if (!hasPermission) {
			throw new Error('no-permission');
		}

		const user = await Users.findOneById<Pick<IUser, 'username'>>(uid, {
			projection: { username: 1 },
		});
		if (!user || !user.username) {
			throw new Error('User not found');
		}

		// TODO convert `createRoom` function to "raw" and move to here
		return createRoom(type, name, user.username, members, readOnly, extraData, options) as unknown as IRoom;
	}

	async createDirectMessage({ to, from }: { to: string; from: string }): Promise<{ rid: string }> {
		const [toUser, fromUser] = await Promise.all([
			Users.findOneById(to, { projection: { username: 1 } }),
			Users.findOneById(from, { projection: { _id: 1 } }),
		]);

		if (!toUser || !fromUser) {
			throw new Error('error-invalid-user');
		}
		return createDirectMessage([toUser.username], fromUser._id);
	}

	async addMember(uid: string, rid: string): Promise<boolean> {
		const hasPermission = await Authorization.hasPermission(uid, 'add-user-to-joined-room', rid);
		if (!hasPermission) {
			throw new Error('no-permission');
		}

		return true;
	}

	async addUserToRoom(
		rid: string,
		user: Pick<IUser, '_id' | 'username'> | string,
		inviter?: Pick<IUser, '_id' | 'username'>,
		silenced?: boolean,
	): Promise<boolean | unknown> {
		return meteorAddUserToRoom(rid, user, inviter, silenced);
	}

	async createDiscussion(params: ICreateDiscussionParams): Promise<IRoom> {
		const { parentRoomId, parentMessageId, creatorId, name, members = [], encrypted, reply } = params;

		const user = await Users.findOneById<Pick<IUser, 'username'>>(creatorId, {
			projection: { username: 1 },
		});

		if (!user || !user.username) {
			throw new Error('User not found');
		}

		// TODO: convert `createDiscussion` function to "raw" and move to here
		return createDiscussion({
			prid: parentRoomId,
			pmid: parentMessageId,
			t_name: name,
			users: members,
			user,
			encrypted,
			reply,
		});
	}
}
