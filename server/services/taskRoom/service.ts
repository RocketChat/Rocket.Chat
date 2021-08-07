import { Db, FindOneOptions, FilterQuery } from 'mongodb';
import { escapeRegExp } from '@rocket.chat/string-helpers';

import { checkUsernameAvailability } from '../../../app/lib/server/functions';
import { addUserToRoom } from '../../../app/lib/server/functions/addUserToRoom';
import { removeUserFromRoom } from '../../../app/lib/server/functions/removeUserFromRoom';
import { getSubscribedRoomsForUserWithDetails } from '../../../app/lib/server/functions/getRoomsWithSingleOwner';
import { MessagesRaw } from '../../../app/models/server/raw/Messages';
import { TasksRaw } from '../../../app/models/server/raw/Tasks';
import { RoomsRaw } from '../../../app/models/server/raw/Rooms';
import { SubscriptionsRaw } from '../../../app/models/server/raw/Subscriptions';
import { TaskRoom } from '../../../app/models/server/raw/TaskRoom';
import { TeamMemberRaw } from '../../../app/models/server/raw/TeamMember';
import { UsersRaw } from '../../../app/models/server/raw/Users';
import { IRoom } from '../../../definition/IRoom';
import { IMessage } from '../../../definition/IMessage';
import {
	IPaginationOptions,
	IQueryOptions,
	IRecordsWithTotal,
	ITaskRoom,
	ITaskRoomMember,
	ITeamStats,
	TASKRoomType,
} from '../../../definition/ITaskRoom';
import { IUser } from '../../../definition/IUser';
import { Room } from '../../sdk';
import {
	IListRoomsFilter,
	ITaskRoomCreateParams,
	ITeamInfo,
	ITeamMemberInfo,
	ITeamMemberParams,
	ITaskRoomService,
	ITeamUpdateData,
} from '../../sdk/types/ITaskRoomService';
import { ServiceClass } from '../../sdk/types/ServiceClass';
import { canAccessRoom } from '../authorization/canAccessRoom';
import { saveRoomName } from '../../../app/channel-settings/server';
import { saveRoomType } from '../../../app/channel-settings/server/functions/saveRoomType';

import { ITask } from '/definition/ITask';

export class TaskRoomService extends ServiceClass implements ITaskRoomService {
	protected name = 'taskRoom';

	private TaskRoomModel: TaskRoom;

	private RoomsModel: RoomsRaw;

	private SubscriptionsModel: SubscriptionsRaw;

	private Users: UsersRaw;

	private TasksModel: TasksRaw;

	constructor(db: Db) {
		super();

		this.RoomsModel = new RoomsRaw(db.collection('rocketchat_room'));
		this.SubscriptionsModel = new SubscriptionsRaw(db.collection('rocketchat_subscription'));
		this.TaskRoomModel = new TaskRoom(db.collection('rocketchat_team'));
		this.Users = new UsersRaw(db.collection('users'));
		this.TasksModel = new TasksRaw(db.collection('rocketchat_task'));
	}

	async create(uid: string, { taskRoom, room = { name: taskRoom.name, extraData: {} }, members, owner }: ITaskRoomCreateParams): Promise<ITaskRoom> {
		if (!checkUsernameAvailability(taskRoom.name)) {
			throw new Error('team-name-already-exists');
		}

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
			const result = await this.TaskRoomModel.insertOne(taskRoomData);

			const taskRoomId = result.insertedId;
			// the same uid can be passed at 3 positions: owner, member list or via caller
			// if the owner is present, remove it from the members list
			// if the owner is not present, remove the caller from the members list
			const excludeFromMembers = owner ? [owner] : [uid];

			// filter empty strings and falsy values from members list
			const membersList: Array<Omit<ITaskRoomMember, '_id'>> = members?.filter(Boolean)
				.filter((memberId) => !excludeFromMembers.includes(memberId))
				.map((memberId) => ({
					taskRoomId,
					userId: memberId,
					createdAt: new Date(),
					createdBy,
					_updatedAt: new Date(), // TODO how to avoid having to do this?
				})) || [];

			membersList.push({
				userId: owner || uid,
				roles: ['owner'],
				createdAt: new Date(),
				createdBy,
				_updatedAt: new Date(), // TODO how to avoid having to do this?
			});


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


			await this.TaskRoomModel.updateMainRoomForTeam(taskRoomId, roomId);
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
