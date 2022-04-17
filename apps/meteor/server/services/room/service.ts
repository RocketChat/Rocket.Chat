import { Db } from 'mongodb';
import type { IRoom, IUser } from '@rocket.chat/core-typings';

import { ServiceClassInternal } from '../../sdk/types/ServiceClass';
import { ICreateRoomParams, IRoomService } from '../../sdk/types/IRoomService';
import { Authorization } from '../../sdk';
import { UsersRaw } from '../../../app/models/server/raw/Users';
import { createRoom } from '../../../app/lib/server/functions/createRoom'; // TODO remove this import

export class RoomService extends ServiceClassInternal implements IRoomService {
	protected name = 'room';

	private Users: UsersRaw;

	constructor(db: Db) {
		super();

		this.Users = new UsersRaw(db.collection('users'));
	}

	async create(uid: string, params: ICreateRoomParams): Promise<IRoom> {
		const { type, name, members = [], readOnly, extraData, options } = params;

		const hasPermission = await Authorization.hasPermission(uid, `create-${type}`);
		if (!hasPermission) {
			throw new Error('no-permission');
		}

		const user = await this.Users.findOneById<Pick<IUser, 'username'>>(uid, {
			projection: { username: 1 },
		});
		if (!user || !user.username) {
			throw new Error('User not found');
		}

		// TODO convert `createRoom` function to "raw" and move to here
		return createRoom(type, name, user.username, members, readOnly, extraData, options) as unknown as IRoom;
	}

	async addMember(uid: string, rid: string): Promise<boolean> {
		const hasPermission = await Authorization.hasPermission(uid, 'add-user-to-joined-room', rid);
		if (!hasPermission) {
			throw new Error('no-permission');
		}

		return true;
	}
}
