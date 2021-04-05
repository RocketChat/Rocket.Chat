import { Db } from 'mongodb';
import { AppsEngineException } from '@rocket.chat/apps-engine/definition/exceptions';

import { ServiceClass } from '../../sdk/types/ServiceClass';
import { ICreateRoomParams, IRoomService } from '../../sdk/types/IRoomService';
import { Authorization, Team } from '../../sdk';
import { IRoom } from '../../../definition/IRoom';
import { UsersRaw } from '../../../app/models/server/raw/Users';
import { RoomsRaw } from '../../../app/models/server/raw/Rooms';
import { createDirectRoom } from '../../../app/lib/server/functions/createDirectRoom';
import { callbacks } from '../../../app/callbacks/server';
import { getValidRoomName } from '../../../app/utils/server';
import { Apps } from '../../../app/apps/server';
import { SubscriptionsRaw } from '../../../app/models/server/raw/Subscriptions';
import { addUserRoles } from '../../../app/authorization/server';
import { ICreateDirectRoomResult } from '../../../app/lib/server/functions/types';
import { ISubscriptionExtraData } from '../../../definition/ISubscription';

export class RoomService extends ServiceClass implements IRoomService {
	protected name = 'room';

	private Users: UsersRaw;

	private Rooms: RoomsRaw;

	private Subscriptions: SubscriptionsRaw;

	constructor(db: Db) {
		super();

		this.Users = new UsersRaw(db.collection('users'));
		this.Rooms = new RoomsRaw(db.collection('rooms'));
		this.Subscriptions = new SubscriptionsRaw(db.collection('subscriptions'));
	}

	async create(uid: string, params: ICreateRoomParams): Promise<IRoom&{rid: string}|ICreateDirectRoomResult> {
		let { readOnly } = params;
		const { type, name, members = [], extraData, options } = params;

		const hasPermission = await Authorization.hasPermission(uid, `create-${ type }`);
		if (!hasPermission) {
			throw new Error('no-permission');
		}

		const owner = await this.Users.findOneById(uid, { projection: { username: 1 } });
		if (!owner) {
			throw new Error('User not found');
		}

		const membersData = await this.Users.findActiveByUsernames(members).toArray();

		const roomName = name.trim();

		if (!roomName) {
			throw new Error('Could not create new room: Invalid room name');
		}

		callbacks.run('beforeCreateRoom', { type, name: roomName, owner: owner.username, members, readOnly, extraData, options });

		if (type === 'd') {
			return createDirectRoom(membersData, extraData, options);
		}

		if (!members.includes(owner.username)) {
			members.push(owner.username);
		}

		if (extraData?.broadcast) {
			readOnly = true;
			delete extraData.reactWhenReadOnly;
		}

		const now = new Date();

		const room = {
			name: getValidRoomName(roomName, undefined, { nameValidationRegex: options?.nameValidationRegex }),
			fname: roomName,
			t: type,
			msgs: 0,
			usersCount: 0,
			u: {
				_id: owner._id,
				username: owner.username,
			},
			...extraData,
			ts: now,
			ro: readOnly === true,
		};

		if (extraData?.teamId) {
			const team = await Team.getOneById(extraData.teamId, { projection: { _id: 1 } });
			if (team) {
				room.teamId = team._id;
			}
		}

		const roomWithUsernames = Object.assign(room, { _USERNAMES: members });

		const prevent = await Apps.triggerEvent('IPreRoomCreatePrevent', roomWithUsernames).catch((error) => {
			if (error instanceof AppsEngineException) {
				throw new Error(`error-app-prevented: ${ error.message }`);
			}

			throw error;
		});

		if (prevent) {
			throw new Error('error-app-prevented. A Rocket.Chat App prevented the room creation.');
		}

		let result;
		result = await Apps.triggerEvent('IPreRoomCreateExtend', roomWithUsernames);
		result = await Apps.triggerEvent('IPreRoomCreateModify', result);

		if (typeof result === 'object') {
			Object.assign(room, result);
		}

		if (type === 'c') {
			callbacks.run('beforeCreateChannel', owner, room);
		}
		const createdRoom = await this.Rooms.createWithFullRoomData(room) as IRoom;


		for (const member of membersData) {
			const extra = options?.subscriptionExtra || {} as ISubscriptionExtraData;

			extra.open = true;

			if (createdRoom.prid) {
				extra.prid = createdRoom.prid;
			}

			if (member.username === owner.username) {
				extra.ls = now;
			}

			this.Subscriptions.createWithRoomAndUser(createdRoom, member, extra);
			this.Rooms.incUsersCountByIds(createdRoom._id);
			this.Users.addRoomByUserId(member._id, createdRoom._id);
		}

		addUserRoles(owner._id, ['owner'], createdRoom._id);

		if (type === 'c') {
			callbacks.run('afterCreateChannel', owner, createdRoom);
		} else if (type === 'p') {
			callbacks.run('afterCreatePrivateGroup', owner, createdRoom);
		}

		callbacks.run('afterCreateRoom', owner, createdRoom);

		Apps.triggerEvent('IPostRoomCreate', createdRoom);

		return {
			rid: createdRoom._id, // backwards compatible
			...createdRoom,
		};
	}

	async addMember(uid: string, rid: string): Promise<boolean> {
		const hasPermission = await Authorization.hasPermission(uid, 'add-user-to-joined-room', rid);
		if (!hasPermission) {
			throw new Error('no-permission');
		}

		return true;
	}
}
