import { Db } from 'mongodb';
import { Random } from 'meteor/random';

import { RoomsRaw } from '../../../app/models/server/raw/Rooms';
import { UsersRaw } from '../../../app/models/server/raw/Users';
import { IRoom } from '../../../definition/IRoom';
import {
	ITaskRoom,
	TASKRoomType,
} from '../../../definition/ITaskRoom';
import { Room, Authorization } from '../../sdk';
import {
	ITaskRoomCreateParams,
	ITaskRoomService,
} from '../../sdk/types/ITaskRoomService';
import { ServiceClass } from '../../sdk/types/ServiceClass';

export class TaskRoomService extends ServiceClass implements ITaskRoomService {
	protected name = 'taskRoom';

	private RoomsModel: RoomsRaw;

	private Users: UsersRaw;

	constructor(db: Db) {
		super();

		this.RoomsModel = new RoomsRaw(db.collection('rocketchat_room'));
		this.Users = new UsersRaw(db.collection('users'));
	}

	async create(uid: string, { taskRoom, room = { name: taskRoom.name, extraData: {} }, members }: ITaskRoomCreateParams): Promise<ITaskRoom> {
		const existingRoom = await this.RoomsModel.findOneByName(taskRoom.name, { projection: { _id: 1 } });
		if (existingRoom && existingRoom._id !== room.id) {
			throw new Error('room-name-already-exists');
		}

		const hasPermission = await Authorization.hasPermission(uid, `create-${ taskRoom.type === 1 ? 'p' : 'c' }`);
		if (!hasPermission) {
			throw new Error('no-permission');
		}
		const createdBy = await this.Users.findOneById(uid, { projection: { username: 1 } });
		if (!createdBy) {
			throw new Error('invalid-user');
		}

		const membersResult = await this.Users.findActiveByIds(members, { projection: { username: 1, _id: 0 } }).toArray();
		const memberUsernames = membersResult.map(({ username }) => username);

		const taskRoomData = {
			...taskRoom,
			createdAt: new Date(),
			createdBy,
			_updatedAt: new Date(), // TODO how to avoid having to do this?
			roomId: '', // this will be populated at the end
		};

		try {
			const taskRoomId = Random.id();
			const roomType: IRoom['t'] = taskRoom.type === TASKRoomType.PRIVATE ? 'p' : 'c';

			const newRoom = {
				...room,
				type: roomType,
				name: taskRoom.name,
				members: memberUsernames,
				extraData: {
					...room.extraData,
					taskRoomId,
				},
			};

			const createdRoom = await Room.create(uid, newRoom);
			const roomId = createdRoom._id;

			taskRoomData.roomId = roomId;

			return {
				_id: taskRoomId,
				taskRoomId,
				...taskRoomData,
			};
		} catch (e) {
			throw new Error('error-taskRoom-creation');
		}
	}
}
