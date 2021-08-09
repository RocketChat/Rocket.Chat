import { Db } from 'mongodb';
import { Random } from 'meteor/random';

import { TasksRaw } from '../../../app/models/server/raw/Tasks';
import { RoomsRaw } from '../../../app/models/server/raw/Rooms';
import { UsersRaw } from '../../../app/models/server/raw/Users';
import { IRoom } from '../../../definition/IRoom';
import {
	ITaskRoom,
	TASKRoomType,
} from '../../../definition/ITaskRoom';
import { Room } from '../../sdk';
import {
	ITaskRoomCreateParams,
	ITaskRoomService,
} from '../../sdk/types/ITaskRoomService';
import { ServiceClass } from '../../sdk/types/ServiceClass';

import { ITask } from '/definition/ITask';

export class TaskRoomService extends ServiceClass implements ITaskRoomService {
	protected name = 'taskRoom';

	private RoomsModel: RoomsRaw;

	private Users: UsersRaw;

	private TasksModel: TasksRaw;

	constructor(db: Db) {
		super();

		this.RoomsModel = new RoomsRaw(db.collection('rocketchat_room'));
		this.Users = new UsersRaw(db.collection('users'));
		this.TasksModel = new TasksRaw(db.collection('rocketchat_task'));
	}

	async create(uid: string, { taskRoom, room = { name: taskRoom.name, extraData: {} }, members, owner }: ITaskRoomCreateParams): Promise<ITaskRoom> {
		const existingRoom = await this.RoomsModel.findOneByName(taskRoom.name, { projection: { _id: 1 } });
		if (existingRoom && existingRoom._id !== room.id) {
			throw new Error('room-name-already-exists');
		}

		const createdBy = await this.Users.findOneById(uid, { projection: { username: 1 } });
		if (!createdBy) {
			throw new Error('invalid-user');
		}

		// TODO add validations to `data` and `members`

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

			const createdRoom = await Room.create(owner || uid, newRoom);
			const roomId = createdRoom._id;

			taskRoomData.roomId = roomId;

			return {
				_id: taskRoomId,
				...taskRoomData,
			};
		} catch (e) {
			throw new Error('error-team-creation');
		}
	}

	async findByMessageId(id: string): Promise<ITask> {
		const [taskDetails] = await Promise.all([
			this.TasksModel.find({ id }).fetch(),
		]);
		return taskDetails;
	}
}
