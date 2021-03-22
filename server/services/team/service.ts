import { Db, FindOneOptions } from 'mongodb';

import { TeamRaw } from '../../../app/models/server/raw/Team';
import { ITeam, ITeamMember, TEAM_TYPE, IRecordsWithTotal, IPaginationOptions, ITeamStats } from '../../../definition/ITeam';
import { Room } from '../../sdk';
import { ITeamCreateParams, ITeamInfo, ITeamMemberInfo, ITeamMemberParams, ITeamService } from '../../sdk/types/ITeamService';
import { IUser } from '../../../definition/IUser';
import { ServiceClass } from '../../sdk/types/ServiceClass';
import { UsersRaw } from '../../../app/models/server/raw/Users';
import { RoomsRaw } from '../../../app/models/server/raw/Rooms';
import { SubscriptionsRaw } from '../../../app/models/server/raw/Subscriptions';
import { TeamMemberRaw } from '../../../app/models/server/raw/TeamMember';
import { MessagesRaw } from '../../../app/models/server/raw/Messages';
import { IRoom } from '../../../definition/IRoom';
import { addUserToRoom } from '../../../app/lib/server/functions/addUserToRoom';
import { canAccessRoom } from '../authorization/canAccessRoom';
import { escapeRegExp } from '../../../lib/escapeRegExp';

export class TeamService extends ServiceClass implements ITeamService {
	protected name = 'team';

	private TeamModel: TeamRaw;

	private RoomsModel: RoomsRaw;

	private SubscriptionsModel: SubscriptionsRaw;

	private Users: UsersRaw;

	private TeamMembersModel: TeamMemberRaw;

	private MessagesModel: MessagesRaw;

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
		this.MessagesModel = new MessagesRaw(db.collection('rocketchat_message'));
	}

	async create(uid: string, { team, room = { name: team.name, extraData: {} }, members, owner }: ITeamCreateParams): Promise<ITeam> {
		const existingTeam = await this.TeamModel.findOneByName(team.name, { projection: { _id: 1 } });
		if (existingTeam) {
			throw new Error('team-name-already-exists');
		}

		const existingRoom = await this.Rooms.findOneByName(team.name, { projection: { _id: 1 } });
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

		const teamData = {
			...team,
			createdAt: new Date(),
			createdBy,
			_updatedAt: new Date(), // TODO how to avoid having to do this?
			roomId: '', // this will be populated at the end
		};

		try {
			const result = await this.TeamModel.insertOne(teamData);
			const teamId = result.insertedId;
			// the same uid can be passed at 3 positions: owner, member list or via caller
			// if the owner is present, remove it from the members list
			// if the owner is not present, remove the caller from the members list
			const excludeFromMembers = owner ? [owner] : [uid];

			// filter empty strings and falsy values from members list
			const membersList: Array<Omit<ITeamMember, '_id'>> = members?.filter(Boolean)
				.filter((memberId) => !excludeFromMembers.includes(memberId))
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

			let roomId = room.id;
			if (!roomId) {
				const roomType: IRoom['t'] = team.type === TEAM_TYPE.PRIVATE ? 'p' : 'c';

				const newRoom = {
					...room,
					type: roomType,
					name: team.name,
					members: memberUsernames,
					extraData: {
						...room.extraData,
						teamId,
						teamMain: true,
					},
				};

				const createdRoom = await Room.create(owner || uid, newRoom);
				roomId = createdRoom._id;
			}

			await this.TeamModel.updateMainRoomForTeam(teamId, roomId);
			teamData.roomId = roomId;

			return {
				_id: teamId,
				...teamData,
			};
		} catch (e) {
			throw new Error('error-team-creation');
		}
	}

	async findBySubscribedUserIds(userId: string, callerId?: string): Promise<ITeam[]> {
		const unfilteredTeams = await this.TeamMembersModel.findByUserId(userId, { projection: { teamId: 1, roles: 1 } }).toArray();
		const unfilteredTeamIds = unfilteredTeams.map(({ teamId }) => teamId);

		let teamIds;

		if (callerId) {
			const publicTeams = await this.TeamModel.findByIdsAndType(unfilteredTeamIds, TEAM_TYPE.PUBLIC, { projection: { teamId: 1 } }).toArray();
			const publicTeamIds = publicTeams.map(({ _id }) => _id);
			const privateTeamIds = unfilteredTeamIds.filter((teamId) => !publicTeamIds.includes(teamId));

			const privateTeams = await this.TeamMembersModel.findByUserIdAndTeamIds(callerId, privateTeamIds, { projection: { teamId: 1 } }).toArray();
			const visibleTeamIds = privateTeams.map(({ teamId }) => teamId).concat(publicTeamIds);
			teamIds = unfilteredTeamIds.filter((teamId) => visibleTeamIds.includes(teamId));
		} else {
			teamIds = unfilteredTeamIds;
		}

		const ownedTeams = unfilteredTeams.filter(({ roles = [] }) => roles.includes('owner')).map(({ teamId }) => teamId);

		const results = await this.TeamModel.findByIds(teamIds).toArray();
		return results.map((team) => ({
			...team,
			isOwner: ownedTeams.includes(team._id),
		}));
	}

	async search(userId: string, term: string | RegExp, options?: FindOneOptions<ITeam>): Promise<ITeam[]> {
		if (typeof term === 'string') {
			term = new RegExp(`^${ escapeRegExp(term) }`, 'i');
		}

		const userTeams = await this.TeamMembersModel.findByUserId(userId, { projection: { teamId: 1 } }).toArray();
		const teamIds = userTeams.map(({ teamId }) => teamId);

		return this.TeamModel.findByNameAndTeamIds(term, teamIds, options).toArray();
	}

	async list(uid: string, { offset, count }: IPaginationOptions = { offset: 0, count: 50 }): Promise<IRecordsWithTotal<ITeamInfo>> {
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

		const records = await cursor.toArray();
		const results: ITeamInfo[] = [];
		for await (const record of records) {
			const rooms = this.RoomsModel.findByTeamId(record._id);
			results.push({
				...record,
				rooms: await rooms.count(),
			});
		}

		return {
			total: await cursor.count(),
			records: results,
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

	async addRoom(uid: string, rid: string, teamId: string, isDefault = false): Promise<IRoom> {
		if (!teamId) {
			throw new Error('missing-teamId');
		}
		if (!rid) {
			throw new Error('missing-roomId');
		}
		if (!uid) {
			throw new Error('missing-userId');
		}
		// at this point, we already checked for the permission
		// so we just need to check if the user can see the room
		const room = await this.RoomsModel.findOneById(rid);
		const user = await this.Users.findOneById(uid);
		const canSeeRoom = await canAccessRoom(room, user);
		if (!canSeeRoom) {
			throw new Error('invalid-room');
		}

		const team = await this.TeamModel.findOneById(teamId, { projection: { _id: 1 } });
		if (!team) {
			throw new Error('invalid-team');
		}
		if (room.teamId) {
			throw new Error('room-already-on-team');
		}

		room.teamId = teamId;
		room.teamDefault = !!isDefault;
		this.RoomsModel.setTeamById(room._id, teamId, isDefault);
		return {
			...room,
		};
	}

	async addRooms(uid: string, rooms: Array<string>, teamId: string): Promise<Array<IRoom>> {
		if (!teamId) {
			throw new Error('missing-teamId');
		}
		if (!rooms) {
			throw new Error('missing-rooms');
		}
		if (!uid) {
			throw new Error('missing-userId');
		}

		const team = await this.TeamModel.findOneById(teamId, { projection: { _id: 1 } });
		if (!team) {
			throw new Error('invalid-team');
		}

		// at this point, we already checked for the permission
		// so we just need to check if the user can see the room
		const user = await this.Users.findOneById(uid);
		const rids = rooms.filter((rid) => rid && typeof rid === 'string');
		const validRooms = await this.RoomsModel.findManyByRoomIds(rids).toArray();
		if (validRooms.length < rids.length) {
			throw new Error('invalid-room');
		}

		// validate access for every room first
		validRooms.forEach(async (room) => {
			const canSeeRoom = await canAccessRoom(room, user);
			if (!canSeeRoom) {
				throw new Error('invalid-room');
			}
		});

		for (const room of validRooms) {
			if (room.teamId) {
				throw new Error('room-already-on-team');
			}

			room.teamId = teamId;
		}

		this.RoomsModel.setTeamByIds(rids, teamId);
		return validRooms;
	}

	async removeRoom(uid: string, rid: string, teamId: string, canRemoveAnyRoom = false): Promise<IRoom> {
		if (!teamId) {
			throw new Error('missing-teamId');
		}
		if (!rid) {
			throw new Error('missing-roomId');
		}
		if (!uid) {
			throw new Error('missing-userId');
		}

		const room = await this.RoomsModel.findOneById(rid);
		if (!room) {
			throw new Error('invalid-room');
		}

		if (!canRemoveAnyRoom) {
			const user = await this.Users.findOneById(uid);
			const canSeeRoom = await canAccessRoom(room, user);
			if (!canSeeRoom) {
				throw new Error('invalid-room');
			}
		}

		const team = await this.TeamModel.findOneById(teamId, { projection: { _id: 1 } });
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

	async unsetTeamIdOfRooms(teamId: string): Promise<void> {
		if (!teamId) {
			throw new Error('missing-teamId');
		}

		await this.RoomsModel.unsetTeamId(teamId);
	}

	async updateRoom(uid: string, rid: string, isDefault: boolean, canUpdateAnyRoom = false): Promise<IRoom> {
		if (!rid) {
			throw new Error('missing-roomId');
		}
		if (!uid) {
			throw new Error('missing-userId');
		}

		const room = await this.RoomsModel.findOneById(rid);
		if (!room) {
			throw new Error('invalid-room');
		}

		if (!canUpdateAnyRoom) {
			const user = await this.Users.findOneById(uid);
			const canSeeRoom = await canAccessRoom(room, user);
			if (!canSeeRoom) {
				throw new Error('invalid-room');
			}
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

	async listRooms(uid: string, teamId: string, getAllRooms: boolean, allowPrivateTeam: boolean, { offset: skip, count: limit }: IPaginationOptions = { offset: 0, count: 50 }): Promise<IRecordsWithTotal<IRoom>> {
		if (!teamId) {
			throw new Error('missing-teamId');
		}
		const team = await this.TeamModel.findOneById(teamId, { projection: { _id: 1, type: 1 } });
		if (!team) {
			throw new Error('invalid-team');
		}
		const isMember = await this.TeamMembersModel.findOneByUserIdAndTeamId(uid, teamId);
		if (team.type === TEAM_TYPE.PRIVATE && !allowPrivateTeam && !isMember) {
			throw new Error('user-not-on-private-team');
		}
		if (getAllRooms) {
			const teamRoomsCursor = this.RoomsModel.findByTeamId(teamId, { skip, limit });
			return {
				total: await teamRoomsCursor.count(),
				records: await teamRoomsCursor.toArray(),
			};
		}
		const teamRooms = await this.RoomsModel.findByTeamId(teamId, { projection: { _id: 1, t: 1 } }).toArray();
		const privateTeamRoomIds = teamRooms.filter((room) => room.t === 'p').map((room) => room._id);
		const publicTeamRoomIds = teamRooms.filter((room) => room.t === 'c').map((room) => room._id);

		const subscriptionsCursor = this.SubscriptionsModel.findByUserIdAndRoomIds(uid, privateTeamRoomIds);
		const subscriptionRoomIds = (await subscriptionsCursor.toArray()).map((subscription) => subscription.rid);
		const availableRoomsCursor = this.RoomsModel.findManyByRoomIds([...subscriptionRoomIds, ...publicTeamRoomIds], { skip, limit });
		return {
			total: await availableRoomsCursor.count(),
			records: await availableRoomsCursor.toArray(),
		};
	}

	async getMatchingTeamRooms(teamId: string, rids: Array<string>): Promise<Array<string>> {
		if (!teamId) {
			throw new Error('missing-teamId');
		}

		if (!rids) {
			return [];
		}

		if (!Array.isArray(rids)) {
			throw new Error('invalid-list-of-rooms');
		}

		const rooms = await this.RoomsModel.findByTeamIdAndRoomsId(teamId, rids, { projection: { _id: 1 } }).toArray();
		return rooms.map(({ _id }: { _id: string}) => _id);
	}

	async members(uid: string, teamId: string, teamName: string, { offset, count }: IPaginationOptions = { offset: 0, count: 50 }): Promise<IRecordsWithTotal<ITeamMemberInfo>> {
		if (!teamId) {
			const teamIdName = await this.TeamModel.findOneByName(teamName, { projection: { _id: 1 } });
			if (!teamIdName) {
				throw new Error('team-does-not-exist');
			}

			teamId = teamIdName._id;
		}

		const isMember = await this.TeamMembersModel.findOneByUserIdAndTeamId(uid, teamId);
		if (!isMember) {
			return {
				total: 0,
				records: [],
			};
		}

		const cursor = this.TeamMembersModel.findMembersInfoByTeamId(teamId, count, offset);

		const records = await cursor.toArray();
		const results: ITeamMemberInfo[] = [];
		for await (const record of records) {
			const user = await this.Users.findOneById(record.userId);
			if (user) {
				results.push({
					user: {
						_id: user._id,
						username: user.username,
						name: user.name,
						status: user.status,
					},
					roles: record.roles,
					createdBy: {
						_id: record.createdBy._id,
						username: record.createdBy.username,
					},
					createdAt: record.createdAt,
				});
			}
		}

		return {
			total: await cursor.count(),
			records: results,
		};
	}

	async addMembers(uid: string, teamId: string, teamName: string, members: Array<ITeamMemberParams>): Promise<void> {
		const createdBy = await this.Users.findOneById(uid, { projection: { username: 1 } });
		if (!createdBy) {
			throw new Error('invalid-user');
		}

		if (!teamId) {
			const teamIdName = await this.TeamModel.findOneByName(teamName, { projection: { _id: 1 } });
			if (!teamIdName) {
				throw new Error('team-does-not-exist');
			}

			teamId = teamIdName._id;
		}

		const membersList: Array<Omit<ITeamMember, '_id'>> = members?.map((member) => ({
			teamId,
			userId: member.userId ? member.userId : '',
			roles: member.roles ? member.roles : [],
			createdAt: new Date(),
			createdBy,
			_updatedAt: new Date(), // TODO how to avoid having to do this?
		})) || [];

		await this.TeamMembersModel.insertMany(membersList);
		await this.addMembersToDefaultRooms(createdBy, teamId, membersList);
	}

	async updateMember(teamId: string, teamName: string, member: ITeamMemberParams): Promise<void> {
		if (!teamId) {
			const teamIdName = await this.TeamModel.findOneByName(teamName, { projection: { _id: 1 } });
			if (!teamIdName) {
				throw new Error('team-does-not-exist');
			}

			teamId = teamIdName._id;
		}

		if (!member.userId) {
			member.userId = await this.Users.findOneByUsername(member.userName);
			if (!member.userId) {
				throw new Error('invalid-user');
			}
		}

		const memberUpdate: Partial<ITeamMember> = {
			roles: member.roles ? member.roles : [],
			_updatedAt: new Date(),
		};

		await this.TeamMembersModel.updateOneByUserIdAndTeamId(member.userId, teamId, memberUpdate);
	}

	async removeMember(teamId: string, userId: string): Promise<void> {
		await this.TeamMembersModel.deleteByUserIdAndTeamId(userId, teamId);
	}

	async removeMembers(teamId: string, teamName: string, members: Array<ITeamMemberParams>): Promise<void> {
		if (!teamId) {
			const teamIdName = await this.TeamModel.findOneByName(teamName, { projection: { _id: 1 } });
			if (!teamIdName) {
				throw new Error('team-does-not-exist');
			}

			teamId = teamIdName._id;
		}

		for await (const member of members) {
			if (!member.userId) {
				member.userId = await this.Users.findOneByUsername(member.userName);
				if (!member.userId) {
					throw new Error('invalid-user');
				}
			}

			const existingMember = await this.TeamMembersModel.findOneByUserIdAndTeamId(member.userId, teamId);
			if (!existingMember) {
				throw new Error('member-does-not-exist');
			}

			if (existingMember.roles?.includes('owner')) {
				const owners = this.TeamMembersModel.findByTeamIdAndRole(teamId, 'owner');
				const totalOwners = await owners.count();
				if (totalOwners === 1) {
					throw new Error('last-owner-can-not-be-removed');
				}
			}

			this.TeamMembersModel.removeById(existingMember._id);
		}
	}

	async addMember(inviter: IUser, userId: string, teamId: string): Promise<boolean> {
		const isAlreadyAMember = await this.TeamMembersModel.findOneByUserIdAndTeamId(userId, teamId, { projection: { _id: 1 } });

		if (isAlreadyAMember) {
			return false;
		}

		const member = (await this.TeamMembersModel.createOneByTeamIdAndUserId(teamId, userId, { _id: inviter._id, username: inviter.username })).ops[0];
		await this.addMembersToDefaultRooms(inviter, teamId, [member]);

		return true;
	}

	async getOneById(teamId: string): Promise<ITeam | undefined> {
		return this.TeamModel.findOneById(teamId);
	}

	async getOneByName(teamName: string): Promise<ITeam | null> {
		return this.TeamModel.findOneByName(teamName);
	}

	async getOneByRoomId(roomId: string): Promise<ITeam | null> {
		return this.TeamModel.findOneByMainRoomId(roomId, { projection: { _id: 1 } });
	}

	async addRolesToMember(teamId: string, userId: string, roles: Array<string>): Promise<boolean> {
		const isMember = await this.TeamMembersModel.findOneByUserIdAndTeamId(userId, teamId, { projection: { _id: 1 } });

		if (!isMember) {
			// TODO should this throw an error instead?
			return false;
		}

		return !!await this.TeamMembersModel.updateRolesByTeamIdAndUserId(teamId, userId, roles);
	}

	async removeRolesFromMember(teamId: string, userId: string, roles: Array<string>): Promise<boolean> {
		const isMember = await this.TeamMembersModel.findOneByUserIdAndTeamId(userId, teamId, { projection: { _id: 1 } });

		if (!isMember) {
			// TODO should this throw an error instead?
			return false;
		}

		return !!await this.TeamMembersModel.removeRolesByTeamIdAndUserId(teamId, userId, roles);
	}

	async getInfoByName(teamName: string): Promise<Partial<ITeam> | undefined> {
		return this.TeamModel.findOne({
			name: teamName,
		}, { projection: { usernames: 0 } });
	}

	async getInfoById(teamId: string): Promise<Partial<ITeam> | undefined> {
		return this.TeamModel.findOne({
			_id: teamId,
		}, { projection: { usernames: 0 } });
	}

	async addMembersToDefaultRooms(inviter: IUser, teamId: string, members: Array<Partial<ITeamMember>>): Promise<void> {
		const defaultRooms = await this.RoomsModel.findDefaultRoomsForTeam(teamId).toArray();
		const users = await this.Users.findActiveByIds(members.map((member) => member.userId)).toArray();

		defaultRooms.map(async (room) => {
			// at this point, users are already part of the team so we won't check for membership
			for await (const user of users) {
				// add each user to the default room
				addUserToRoom(room._id, user, inviter, false);
			}
		});
	}

	async deleteById(teamId: string): Promise<boolean> {
		return !!await this.TeamModel.deleteOneById(teamId);
	}

	async deleteByName(teamName: string): Promise<boolean> {
		return !!await this.TeamModel.deleteOneByName(teamName);
	}

	async getStatistics(): Promise<ITeamStats> {
		const stats = {} as ITeamStats;
		const teams = this.TeamModel.find({});
		const teamsArray = await teams.toArray();

		stats.totalTeams = await teams.count();
		stats.teamStats = [];

		for await (const team of teamsArray) {
			// exclude the main room from the stats
			const teamRooms = await this.RoomsModel.find({ teamId: team._id, teamMain: { $exists: false } }).toArray();
			const roomIds = teamRooms.map((r) => r._id);
			const [totalMessagesInTeam, defaultRooms, totalMembers] = await Promise.all([
				this.MessagesModel.find({ rid: { $in: roomIds } }).count(),
				this.RoomsModel.findDefaultRoomsForTeam(team._id).count(),
				this.TeamMembersModel.findByTeamId(team._id).count(),
			]);

			const teamData = {
				teamId: team._id,
				mainRoom: team.roomId,
				totalRooms: teamRooms.length,
				totalMessages: totalMessagesInTeam,
				totalPublicRooms: teamRooms.filter((r) => r.t === 'c').length,
				totalPrivateRooms: teamRooms.filter((r) => r.t !== 'c').length,
				totalDefaultRooms: defaultRooms,
				totalMembers,
			};

			stats.teamStats.push(teamData);
		}

		return stats;
	}
}
