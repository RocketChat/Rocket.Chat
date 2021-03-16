import { Db } from 'mongodb';

import { TeamRaw } from '../../../app/models/server/raw/Team';
import { ITeam, ITeamMember, TEAM_TYPE, IRecordsWithTotal, IPaginationOptions } from '../../../definition/ITeam';
import { Authorization, Room } from '../../sdk';
import { ITeamCreateParams, ITeamService } from '../../sdk/types/ITeamService';
import { ServiceClass } from '../../sdk/types/ServiceClass';
import { UsersRaw } from '../../../app/models/server/raw/Users';
import { RoomsRaw } from '../../../app/models/server/raw/Rooms';
import { SubscriptionsRaw } from '../../../app/models/server/raw/Subscriptions';
import { TeamMemberRaw } from '../../../app/models/server/raw/TeamMember';
import { IRoom } from '../../../definition/IRoom';

export class TeamService extends ServiceClass implements ITeamService {
	protected name = 'team';

	private TeamModel: TeamRaw;

	private RoomsModel: RoomsRaw;

	private SubscriptionsModel: SubscriptionsRaw;

	private Users: UsersRaw;

	private TeamMembersModel: TeamMemberRaw;

	// TODO not sure we should have the collection here or call the Room service for getting Room data
	private Rooms: RoomsRaw;

	constructor(db: Db) {
		super();

		this.RoomsModel = new RoomsRaw(db.collection('rocketchat_room'));
		this.SubscriptionsModel = new SubscriptionsRaw(db.collection('rocketchat_subscription'));
		this.TeamModel = new TeamRaw(db.collection('rocketchat_team'));
		this.TeamMembersModel = new TeamMemberRaw(db.collection('rocketchat_team_member'));
		this.Users = new UsersRaw(db.collection('users'));
		this.Rooms = new RoomsRaw(db.collection('rocketchat_room'));
	}

	async create(uid: string, { team, room = { name: team.name, extraData: {} }, members, owner }: ITeamCreateParams): Promise<ITeam> {
		const hasPermission = await Authorization.hasPermission(uid, 'create-team');
		if (!hasPermission) {
			throw new Error('no-permission');
		}

		const existingTeam = await this.TeamModel.findOneByName(team.name, { projection: { _id: 1 } });
		if (existingTeam) {
			throw new Error('team-name-already-exists');
		}

		const existingRoom = await this.Rooms.findOneByName(team.name, { projection: { _id: 1 } });
		if (existingRoom) {
			throw new Error('room-name-already-exists');
		}

		const createdBy = await this.Users.findOneById(uid, { projection: { username: 1 } });
		if (!createdBy) {
			throw new Error('invalid-user');
		}

		// TODO add validations to `data` and `members`

		const membersResult = await this.Users.findActiveByIds(members, { projection: { username: 1, _id: 0 } }).toArray();
		const memberUsernames = membersResult.map(({ username }) => username);

		const teamData = {
			...team,
			createdAt: new Date(),
			createdBy,
			_updatedAt: new Date(), // TODO how to avoid having to do this?
		};

		try {
			const result = await this.TeamModel.insertOne(teamData);
			const teamId = result.insertedId;

			const membersList: Array<Omit<ITeamMember, '_id'>> = members?.filter((memberId) => ![uid, owner].includes(memberId))
				.map((memberId) => ({
					teamId,
					userId: memberId,
					createdAt: new Date(),
					createdBy,
					_updatedAt: new Date(), // TODO how to avoid having to do this?
				})) || [];

			membersList.push({
				teamId,
				userId: owner || uid,
				roles: ['owner'],
				createdAt: new Date(),
				createdBy,
				_updatedAt: new Date(), // TODO how to avoid having to do this?
			});

			await this.TeamMembersModel.insertMany(membersList);

			const roomType: IRoom['t'] = team.type === TEAM_TYPE.PRIVATE ? 'p' : 'c';

			const newRoom = {
				...room,
				type: roomType,
				name: team.name,
				members: memberUsernames,
				extraData: {
					...room.extraData,
					teamId,
				},
			};

			await Room.create(owner || uid, newRoom);

			return {
				_id: teamId,
				...teamData,
			};
		} catch (e) {
			throw new Error('error-team-creation');
		}
	}

	async list(uid: string, { offset, count }: IPaginationOptions = { offset: 0, count: 50 }): Promise<IRecordsWithTotal<ITeam>> {
		const userTeams = await this.TeamMembersModel.findByUserId(uid, { projection: { teamId: 1 } }).toArray();

		const teamIds = userTeams.map(({ teamId }) => teamId);
		if (teamIds.length === 0) {
			return {
				total: 0,
				records: [],
			};
		}

		const cursor = this.TeamModel.findByIds(teamIds, {
			limit: count,
			skip: offset,
		});

		return {
			total: await cursor.count(),
			records: await cursor.toArray(),
		};
	}

	async listAll({ offset, count }: IPaginationOptions = { offset: 0, count: 50 }): Promise<IRecordsWithTotal<ITeam>> {
		const cursor = this.TeamModel.find({}, {
			limit: count,
			skip: offset,
		});

		return {
			total: await cursor.count(),
			records: await cursor.toArray(),
		};
	}

	async addRoom(uid: string, rid: string, teamId: string, isDefault: boolean): Promise<IRoom> {
		if (!teamId) {
			throw new Error('missing-teamId');
		}
		if (!rid) {
			throw new Error('missing-roomId');
		}
		if (!uid) {
			throw new Error('missing-userId');
		}
		const room = await this.RoomsModel.findOneByRoomIdAndUserId(rid, uid);
		if (!room) {
			throw new Error('invalid-room');
		}
		const team = await this.TeamModel.findOneById(teamId);
		if (!team) {
			throw new Error('invalid-team');
		}
		if (room.teamId) {
			throw new Error('room-already-on-team');
		}
		if (isDefault == null) {
			isDefault = false;
		}
		room.teamId = teamId;
		room.teamDefault = isDefault;
		this.RoomsModel.setTeamById(room._id, teamId, isDefault);
		return {
			...room,
		};
	}

	async removeRoom(uid: string, rid: string, teamId: string): Promise<IRoom> {
		if (!teamId) {
			throw new Error('missing-teamId');
		}
		if (!rid) {
			throw new Error('missing-roomId');
		}
		if (!uid) {
			throw new Error('missing-userId');
		}
		const room = await this.RoomsModel.findOneByRoomIdAndUserId(rid, uid);
		if (!room) {
			throw new Error('invalid-room');
		}
		const team = await this.TeamModel.findOneById(teamId);
		if (!team) {
			throw new Error('invalid-team');
		}
		if (room.teamId !== teamId) {
			throw new Error('room-not-on-that-team');
		}
		delete room.teamId;
		delete room.teamDefault;
		this.RoomsModel.unsetTeamById(room._id);
		return {
			...room,
		};
	}

	async updateRoom(uid: string, rid: string, isDefault: boolean): Promise<IRoom> {
		if (!rid) {
			throw new Error('missing-roomId');
		}
		if (!uid) {
			throw new Error('missing-userId');
		}
		const room = await this.RoomsModel.findOneByRoomIdAndUserId(rid, uid);
		if (!room) {
			throw new Error('invalid-room');
		}
		if (!room.teamId) {
			throw new Error('room-not-on-team');
		}
		room.teamDefault = isDefault;
		this.RoomsModel.setTeamDefaultById(rid, isDefault);
		return {
			...room,
		};
	}

	async listRooms(uid: string, teamId: string, getAllRooms: boolean, allowPrivateTeam: boolean): Promise<IRecordsWithTotal<IRoom>> {
		if (!teamId) {
			throw new Error('missing-teamId');
		}
		const team = await this.TeamModel.findOneById(teamId, {});
		if (!team) {
			throw new Error('invalid-team');
		}
		const isMember = await this.TeamMembersModel.findOneByUserIdAndTeamId(uid, teamId);
		if (team.type === TEAM_TYPE.PRIVATE && !allowPrivateTeam && !isMember) {
			throw new Error('user-not-on-private-team');
		}
		const teamRoomsCursor = this.RoomsModel.findByTeamId(teamId);
		if (getAllRooms) {
			return {
				total: await teamRoomsCursor.count(),
				records: await teamRoomsCursor.toArray(),
			};
		}
		const teamRooms = await teamRoomsCursor.toArray();
		const privateTeamRoomIds = teamRooms.filter((room) => room.t === 'p').map((room) => room._id);
		const publicTeamRoomIds = teamRooms.filter((room) => room.t === 'c').map((room) => room._id);

		const subscriptionsCursor = this.SubscriptionsModel.findByUserIdAndRoomIds(uid, privateTeamRoomIds);
		const subscriptionRoomIds = (await subscriptionsCursor.toArray()).map((subscription) => subscription.rid);
		const availableRoomsCursor = this.RoomsModel.findManyByRoomIds([...subscriptionRoomIds, ...publicTeamRoomIds]);
		return {
			total: await availableRoomsCursor.count(),
			records: await availableRoomsCursor.toArray(),
		};
	}

	async members(userId: string, teamId: string): Promise<Array<ITeamMember>> {
		const isMember = await this.TeamMembersModel.findOneByUserIdAndTeamId(userId, teamId);
		const hasPermission = await Authorization.hasAtLeastOnePermission(userId, ['add-team-member', 'edit-team-member', 'view-all-teams']);
		if (!hasPermission) {
			throw new Error('no-permission');
		}

		if (!isMember && !hasPermission) {
			return [];
		}

		return this.TeamMembersModel.findByTeamId(teamId).toArray();
	}
}
