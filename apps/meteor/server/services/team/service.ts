import { Db, FindOneOptions, FilterQuery, WithoutProjection } from 'mongodb';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import type { IRoom, IUser, ISubscription } from '@rocket.chat/core-typings';
import { IPaginationOptions, IQueryOptions, IRecordsWithTotal, ITeam, ITeamMember, ITeamStats, TEAM_TYPE } from '@rocket.chat/core-typings';

import { checkUsernameAvailability } from '../../../app/lib/server/functions';
import { addUserToRoom } from '../../../app/lib/server/functions/addUserToRoom';
import { removeUserFromRoom } from '../../../app/lib/server/functions/removeUserFromRoom';
import { getSubscribedRoomsForUserWithDetails } from '../../../app/lib/server/functions/getRoomsWithSingleOwner';
import type { InsertionModel } from '../../../app/models/server/raw/BaseRaw';
import { RoomsRaw } from '../../../app/models/server/raw/Rooms';
import { SubscriptionsRaw } from '../../../app/models/server/raw/Subscriptions';
import { TeamRaw } from '../../../app/models/server/raw/Team';
import { TeamMemberRaw } from '../../../app/models/server/raw/TeamMember';
import { UsersRaw } from '../../../app/models/server/raw/Users';
import { Messages } from '../../../app/models/server';
import { Room, Authorization } from '../../sdk';
import {
	IListRoomsFilter,
	ITeamAutocompleteResult,
	ITeamCreateParams,
	ITeamInfo,
	ITeamMemberInfo,
	ITeamMemberParams,
	ITeamService,
	ITeamUpdateData,
} from '../../sdk/types/ITeamService';
import { ServiceClassInternal } from '../../sdk/types/ServiceClass';
import { saveRoomName } from '../../../app/channel-settings/server';
import { saveRoomType } from '../../../app/channel-settings/server/functions/saveRoomType';

export class TeamService extends ServiceClassInternal implements ITeamService {
	protected name = 'team';

	private TeamModel: TeamRaw;

	private RoomsModel: RoomsRaw;

	private SubscriptionsModel: SubscriptionsRaw;

	private Users: UsersRaw;

	private TeamMembersModel: TeamMemberRaw;

	constructor(db: Db) {
		super();

		this.RoomsModel = new RoomsRaw(db.collection('rocketchat_room'));
		this.Users = new UsersRaw(db.collection('users'));
		this.SubscriptionsModel = new SubscriptionsRaw(db.collection('rocketchat_subscription'), {
			Users: this.Users,
		});
		this.TeamModel = new TeamRaw(db.collection('rocketchat_team'));
		this.TeamMembersModel = new TeamMemberRaw(db.collection('rocketchat_team_member'));
	}

	async create(uid: string, { team, room = { name: team.name, extraData: {} }, members, owner }: ITeamCreateParams): Promise<ITeam> {
		if (!checkUsernameAvailability(team.name)) {
			throw new Error('team-name-already-exists');
		}

		const existingRoom = await this.RoomsModel.findOneByName(team.name, { projection: { _id: 1 } });
		if (existingRoom && existingRoom._id !== room.id) {
			throw new Error('room-name-already-exists');
		}

		const createdBy = await this.Users.findOneById<Pick<IUser, 'username' | '_id'>>(uid, {
			projection: { username: 1 },
		});
		if (!createdBy) {
			throw new Error('invalid-user');
		}

		// TODO add validations to `data` and `members`

		const membersResult = await this.Users.findActiveByIds(members, {
			projection: { username: 1, _id: 0 },
		}).toArray();
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
			const membersList: Array<InsertionModel<ITeamMember>> =
				members
					?.filter(Boolean)
					.filter((memberId) => !excludeFromMembers.includes(memberId))
					.map((memberId) => ({
						teamId,
						userId: memberId,
						createdAt: new Date(),
						createdBy,
					})) || [];

			membersList.push({
				teamId,
				userId: owner || uid,
				roles: ['owner'],
				createdAt: new Date(),
				createdBy,
			});

			await this.TeamMembersModel.insertMany(membersList);

			let roomId = room.id;
			if (roomId) {
				await this.RoomsModel.setTeamMainById(roomId, teamId);
				Messages.createUserConvertChannelToTeamWithRoomIdAndUser(roomId, team.name, createdBy);
			} else {
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

	async update(uid: string, teamId: string, updateData: ITeamUpdateData): Promise<void> {
		const team = await this.TeamModel.findOneById<Pick<ITeam, '_id' | 'roomId'>>(teamId, {
			projection: { roomId: 1 },
		});
		if (!team) {
			return;
		}

		const user = await this.Users.findOneById(uid);
		if (!user) {
			return;
		}

		const { name, type, updateRoom = true } = updateData;

		if (updateRoom && name) {
			await saveRoomName(team.roomId, name, user);
		}

		if (updateRoom && typeof type !== 'undefined') {
			saveRoomType(team.roomId, type === TEAM_TYPE.PRIVATE ? 'p' : 'c', user);
		}

		await this.TeamModel.updateNameAndType(teamId, updateData);
	}

	async findBySubscribedUserIds(userId: string, callerId?: string): Promise<ITeam[]> {
		const unfilteredTeams = await this.TeamMembersModel.findByUserId<Pick<ITeamMember, 'roles' | 'teamId'>>(userId, {
			projection: { teamId: 1, roles: 1 },
		}).toArray();
		const unfilteredTeamIds = unfilteredTeams.map(({ teamId }) => teamId);

		let teamIds = unfilteredTeamIds;

		if (callerId) {
			const publicTeams = await this.TeamModel.findByIdsAndType<Pick<ITeam, '_id'>>(unfilteredTeamIds, TEAM_TYPE.PUBLIC, {
				projection: { _id: 1 },
			}).toArray();
			const publicTeamIds = publicTeams.map(({ _id }) => _id);
			const privateTeamIds = unfilteredTeamIds.filter((teamId) => !publicTeamIds.includes(teamId));

			const privateTeams = await this.TeamMembersModel.findByUserIdAndTeamIds(callerId, privateTeamIds, {
				projection: { teamId: 1 },
			}).toArray();
			const visibleTeamIds = privateTeams.map(({ teamId }) => teamId).concat(publicTeamIds);
			teamIds = unfilteredTeamIds.filter((teamId) => visibleTeamIds.includes(teamId));
		}

		const ownedTeams = unfilteredTeams.filter(({ roles = [] }) => roles.includes('owner')).map(({ teamId }) => teamId);

		const results = await this.TeamModel.findByIds(teamIds).toArray();
		return results.map((team) => ({
			...team,
			isOwner: ownedTeams.includes(team._id),
		}));
	}

	search(userId: string, term: string | RegExp): Promise<ITeam[]>;

	search(userId: string, term: string | RegExp, options: WithoutProjection<FindOneOptions<ITeam>>): Promise<ITeam[]>;

	search<P>(userId: string, term: string | RegExp, options: FindOneOptions<P extends ITeam ? ITeam : P>): Promise<P[]>;

	async search<P>(
		userId: string,
		term: string | RegExp,
		options?: undefined | WithoutProjection<FindOneOptions<ITeam>> | FindOneOptions<P extends ITeam ? ITeam : P>,
	): Promise<ITeam[] | P[]> {
		if (typeof term === 'string') {
			term = new RegExp(`^${escapeRegExp(term)}`, 'i');
		}

		const userTeams = await this.TeamMembersModel.findByUserId<Pick<ITeamMember, 'teamId'>>(userId, {
			projection: { teamId: 1 },
		}).toArray();
		const teamIds = userTeams.map(({ teamId }) => teamId);

		return options
			? this.TeamModel.findByNameAndTeamIds(term, teamIds, options).toArray()
			: this.TeamModel.findByNameAndTeamIds(term, teamIds).toArray();
	}

	async list(
		uid: string,
		{ offset, count }: IPaginationOptions = { offset: 0, count: 50 },
		{ sort, query }: IQueryOptions<ITeam> = { sort: {} },
	): Promise<IRecordsWithTotal<ITeamInfo>> {
		const userTeams = await this.TeamMembersModel.findByUserId<Pick<ITeamMember, 'teamId'>>(uid, {
			projection: { teamId: 1 },
		}).toArray();

		const teamIds = userTeams.map(({ teamId }) => teamId);
		if (teamIds.length === 0) {
			return {
				total: 0,
				records: [],
			};
		}

		const cursor = this.TeamModel.findByIds(
			teamIds,
			{
				...(sort && { sort }),
				limit: count,
				skip: offset,
			},
			query,
		);

		const records = await cursor.toArray();
		const results: ITeamInfo[] = [];
		for await (const record of records) {
			const rooms = this.RoomsModel.findByTeamId(record._id);
			const users = this.TeamMembersModel.findByTeamId(record._id);
			results.push({
				...record,
				rooms: await rooms.count(),
				numberOfUsers: await users.count(),
			});
		}

		return {
			total: await cursor.count(),
			records: results,
		};
	}

	async listAll({ offset, count }: IPaginationOptions = { offset: 0, count: 50 }): Promise<IRecordsWithTotal<ITeamInfo>> {
		const cursor = this.TeamModel.find(
			{},
			{
				limit: count,
				skip: offset,
			},
		);

		const records = await cursor.toArray();

		const results: ITeamInfo[] = [];
		for await (const record of records) {
			const rooms = this.RoomsModel.findByTeamId(record._id);
			const users = this.TeamMembersModel.findByTeamId(record._id);
			results.push({
				...record,
				rooms: await rooms.count(),
				numberOfUsers: await users.count(),
			});
		}

		return {
			total: await cursor.count(),
			records: results,
		};
	}

	listByNames(names: Array<string>): Promise<ITeam[]>;

	listByNames(names: Array<string>, options: WithoutProjection<FindOneOptions<ITeam>>): Promise<ITeam[]>;

	listByNames<P>(names: Array<string>, options: FindOneOptions<P extends ITeam ? ITeam : P>): Promise<P[]>;

	async listByNames<P>(
		names: Array<string>,
		options?: undefined | WithoutProjection<FindOneOptions<ITeam>> | FindOneOptions<P extends ITeam ? ITeam : P>,
	): Promise<P[] | ITeam[]> {
		if (options === undefined) {
			return this.TeamModel.findByNames(names).toArray();
		}
		return this.TeamModel.findByNames(names, options).toArray();
	}

	async listByIds(ids: Array<string>, options?: FindOneOptions<ITeam>): Promise<ITeam[]> {
		return this.TeamModel.findByIds(ids, options).toArray();
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

		const team = await this.TeamModel.findOneById<Pick<ITeam, '_id' | 'roomId'>>(teamId, { projection: { _id: 1, roomId: 1 } });
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
		for await (const room of validRooms) {
			const canSeeRoom = await Authorization.canAccessRoom(room, user);
			if (!canSeeRoom) {
				throw new Error('invalid-room');
			}
		}

		for await (const room of validRooms) {
			if (room.teamId) {
				throw new Error('room-already-on-team');
			}

			if (!(await this.SubscriptionsModel.isUserInRole(uid, 'owner', room._id))) {
				throw new Error('error-no-owner-channel');
			}

			if (room.t === 'c') {
				Messages.createUserAddRoomToTeamWithRoomIdAndUser(team.roomId, room.name, user);
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

		const user = await this.Users.findOneById(uid);
		if (!canRemoveAnyRoom) {
			const canSeeRoom = await Authorization.canAccessRoom(room, user);
			if (!canSeeRoom) {
				throw new Error('invalid-room');
			}
		}

		const team = await this.TeamModel.findOneById<Pick<ITeam, '_id' | 'roomId'>>(teamId, { projection: { _id: 1, roomId: 1 } });
		if (!team) {
			throw new Error('invalid-team');
		}

		if (room.teamId !== teamId) {
			throw new Error('room-not-on-that-team');
		}

		delete room.teamId;
		delete room.teamDefault;
		this.RoomsModel.unsetTeamById(room._id);

		if (room.t === 'c') {
			Messages.createUserRemoveRoomFromTeamWithRoomIdAndUser(team.roomId, room.name, user);
		}

		return {
			...room,
		};
	}

	async unsetTeamIdOfRooms(uid: string, teamId: string): Promise<void> {
		if (!teamId) {
			throw new Error('missing-teamId');
		}

		const team = await this.TeamModel.findOneById<Pick<ITeam, 'roomId'>>(teamId, { projection: { roomId: 1 } });
		if (!team) {
			throw new Error('invalid-team');
		}

		const room = await this.RoomsModel.findOneById<Pick<IRoom, 'name'>>(team.roomId, { projection: { name: 1 } });
		if (!room) {
			throw new Error('invalid-room');
		}

		const user = await this.Users.findOneById(uid);

		Messages.createUserConvertTeamToChannelWithRoomIdAndUser(team.roomId, room.name, user);

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

		const user = await this.Users.findOneById(uid);
		if (!canUpdateAnyRoom) {
			const canSeeRoom = await Authorization.canAccessRoom(room, user);
			if (!canSeeRoom) {
				throw new Error('invalid-room');
			}
		}

		if (!room.teamId) {
			throw new Error('room-not-on-team');
		}
		room.teamDefault = isDefault;
		this.RoomsModel.setTeamDefaultById(rid, isDefault);

		if (room.teamDefault) {
			const teamMembers = await this.members(uid, room.teamId, true, undefined, undefined);

			teamMembers.records.map((m) => addUserToRoom(room._id, m.user, user));
		}

		return {
			...room,
		};
	}

	listTeamsBySubscriberUserId(uid: string): Promise<ITeamMember[]>;

	listTeamsBySubscriberUserId(uid: string, options: WithoutProjection<FindOneOptions<ITeamMember>>): Promise<ITeamMember[]>;

	listTeamsBySubscriberUserId<P>(uid: string, options: FindOneOptions<P>): Promise<P[]>;

	listTeamsBySubscriberUserId<P>(
		uid: string,
		options?: undefined | WithoutProjection<FindOneOptions<ITeamMember>> | FindOneOptions<P extends ITeamMember ? ITeamMember : P>,
	): Promise<P[] | ITeamMember[]> {
		if (options) {
			this.TeamMembersModel.findByUserId(uid, options).toArray();
		}
		return this.TeamMembersModel.findByUserId(uid).toArray();
	}

	async listRooms(
		uid: string,
		teamId: string,
		filter: IListRoomsFilter,
		{ offset: skip, count: limit }: IPaginationOptions = { offset: 0, count: 50 },
	): Promise<IRecordsWithTotal<IRoom>> {
		if (!teamId) {
			throw new Error('missing-teamId');
		}
		const team = await this.TeamModel.findOneById<Pick<ITeam, '_id' | 'type'>>(teamId, {
			projection: { _id: 1, type: 1 },
		});
		if (!team) {
			throw new Error('invalid-team');
		}

		const { getAllRooms, allowPrivateTeam, name, isDefault } = filter;

		const isMember = await this.TeamMembersModel.findOneByUserIdAndTeamId(uid, teamId);
		if (team.type === TEAM_TYPE.PRIVATE && !allowPrivateTeam && !isMember) {
			throw new Error('user-not-on-private-team');
		}

		if (getAllRooms) {
			const teamRoomsCursor = this.RoomsModel.findByTeamIdContainingNameAndDefault(teamId, name, isDefault, undefined, { skip, limit });
			return {
				total: await teamRoomsCursor.count(),
				records: await teamRoomsCursor.toArray(),
			};
		}

		const user = await this.Users.findOneById<{ __rooms: string[] }>(uid, {
			projection: { __rooms: 1 },
		});
		const userRooms = user?.__rooms;
		const validTeamRoomsCursor = this.RoomsModel.findByTeamIdContainingNameAndDefault(teamId, name, isDefault, userRooms, { skip, limit });

		return {
			total: await validTeamRoomsCursor.count(),
			records: await validTeamRoomsCursor.toArray(),
		};
	}

	async listRoomsOfUser(
		uid: string,
		teamId: string,
		userId: string,
		allowPrivateTeam: boolean,
		showCanDeleteOnly: boolean,
		{ offset: skip, count: limit }: IPaginationOptions = { offset: 0, count: 50 },
	): Promise<IRecordsWithTotal<IRoom>> {
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

		const teamRooms: (IRoom & {
			userCanDelete?: boolean;
		})[] = await this.RoomsModel.findByTeamId(teamId, {
			projection: { _id: 1, t: 1 },
		}).toArray();

		let teamRoomIds: string[];

		if (showCanDeleteOnly) {
			for await (const room of teamRooms) {
				const roomType = room.t;
				const canDeleteRoom = await Authorization.hasPermission(userId, roomType === 'c' ? 'delete-c' : 'delete-p', room._id);
				room.userCanDelete = canDeleteRoom;
			}

			teamRoomIds = teamRooms.filter((room) => (room.t === 'c' || room.t === 'p') && room.userCanDelete).map((room) => room._id);
		} else {
			teamRoomIds = teamRooms.filter((room) => room.t === 'p' || room.t === 'c').map((room) => room._id);
		}

		const subscriptionsCursor = this.SubscriptionsModel.findByUserIdAndRoomIds(userId, teamRoomIds);
		const subscriptionRoomIds = (await subscriptionsCursor.toArray()).map((subscription) => subscription.rid);
		const availableRoomsCursor = this.RoomsModel.findManyByRoomIds(subscriptionRoomIds, {
			skip,
			limit,
		});
		const rooms = await availableRoomsCursor.toArray();
		const roomData = getSubscribedRoomsForUserWithDetails(userId, false, teamRoomIds);
		const records = [];

		for (const room of rooms) {
			const roomInfo = roomData.find((data) => data.rid === room._id);
			if (!roomInfo) {
				continue;
			}
			room.isLastOwner = roomInfo.userIsLastOwner;
			records.push(room);
		}

		return {
			total: await availableRoomsCursor.count(),
			records,
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

		const rooms = await this.RoomsModel.findByTeamIdAndRoomsId(teamId, rids, {
			projection: { _id: 1 },
		}).toArray();
		return rooms.map(({ _id }: { _id: string }) => _id);
	}

	async getMembersByTeamIds(teamIds: Array<string>, options: FindOneOptions<ITeamMember>): Promise<Array<ITeamMember>> {
		return this.TeamMembersModel.findByTeamIds(teamIds, options).toArray();
	}

	async members(
		uid: string,
		teamId: string,
		canSeeAll: boolean,
		{ offset, count }: IPaginationOptions = { offset: 0, count: 50 },
		query: FilterQuery<IUser> = {},
	): Promise<IRecordsWithTotal<ITeamMemberInfo>> {
		const isMember = await this.TeamMembersModel.findOneByUserIdAndTeamId(uid, teamId);
		if (!isMember && !canSeeAll) {
			return {
				total: 0,
				records: [],
			};
		}

		const users = await this.Users.find({ ...query }).toArray();
		const userIds = users.map((m) => m._id);
		const cursor = this.TeamMembersModel.findMembersInfoByTeamId(teamId, count, offset, {
			userId: { $in: userIds },
		});

		const records = await cursor.toArray();
		const results: ITeamMemberInfo[] = [];
		for await (const record of records) {
			const user = users.find((u) => u._id === record.userId);
			results.push({
				user: {
					_id: user._id,
					username: user.username,
					name: user.name,
					status: user.status,
					settings: user.settings,
				},
				roles: record.roles,
				createdBy: {
					_id: record.createdBy._id,
					username: record.createdBy.username,
				},
				createdAt: record.createdAt,
			});
		}

		return {
			total: await cursor.count(),
			records: results,
		};
	}

	async addMembers(uid: string, teamId: string, members: Array<ITeamMemberParams>): Promise<void> {
		const createdBy = (await this.Users.findOneById(uid, { projection: { username: 1 } })) as Pick<IUser, '_id' | 'username'>;
		if (!createdBy) {
			throw new Error('invalid-user');
		}

		const team = await this.TeamModel.findOneById<Pick<ITeam, 'roomId'>>(teamId, {
			projection: { roomId: 1 },
		});
		if (!team) {
			throw new Error('team-does-not-exist');
		}

		for await (const member of members) {
			const user = (await this.Users.findOneById(member.userId, { projection: { username: 1 } })) as Pick<IUser, '_id' | 'username'>;
			await addUserToRoom(team.roomId, user, createdBy, false);

			if (member.roles) {
				await this.addRolesToMember(teamId, member.userId, member.roles);
			}
		}
	}

	async updateMember(teamId: string, member: ITeamMemberParams): Promise<void> {
		if (!member.userId) {
			throw new Error('invalid-user');
		}

		const memberUpdate: Partial<ITeamMember> = {
			roles: member.roles ? member.roles : [],
		};

		await this.TeamMembersModel.updateOneByUserIdAndTeamId(member.userId, teamId, memberUpdate);
	}

	async removeMember(teamId: string, userId: string): Promise<void> {
		await this.TeamMembersModel.deleteByUserIdAndTeamId(userId, teamId);
	}

	async removeMembers(uid: string, teamId: string, members: Array<ITeamMemberParams>): Promise<boolean> {
		const team = await this.TeamModel.findOneById<Pick<ITeam, 'roomId' | '_id'>>(teamId, {
			projection: { _id: 1, roomId: 1 },
		});
		if (!team) {
			throw new Error('team-does-not-exist');
		}

		const membersIds = members.map((m) => m.userId);
		const usersToRemove = await this.Users.findByIds(membersIds, {
			projection: { _id: 1, username: 1 },
		}).toArray();
		const byUser = (await this.Users.findOneById(uid, { projection: { _id: 1, username: 1 } })) as Pick<IUser, '_id' | 'username'>;

		for await (const member of members) {
			if (!member.userId) {
				throw new Error('invalid-user');
			}

			const existingMember = await this.TeamMembersModel.findOneByUserIdAndTeamId(member.userId, team._id);
			if (!existingMember) {
				throw new Error('member-does-not-exist');
			}

			if (existingMember.roles?.includes('owner')) {
				const owners = this.TeamMembersModel.findByTeamIdAndRole(team._id, 'owner');
				const totalOwners = await owners.count();
				if (totalOwners === 1) {
					throw new Error('last-owner-can-not-be-removed');
				}
			}

			this.TeamMembersModel.removeById(existingMember._id);
			const removedUser = usersToRemove.find((u) => u._id === existingMember.userId);
			await removeUserFromRoom(
				team.roomId,
				removedUser,
				uid !== member.userId
					? {
							byUser,
					  }
					: undefined,
			);
		}

		return true;
	}

	async insertMemberOnTeams(userId: string, teamIds: Array<string>): Promise<void> {
		const inviter = { _id: 'rocket.cat', username: 'rocket.cat' };

		await Promise.all(
			teamIds.map(async (teamId) => {
				const team = await this.TeamModel.findOneById(teamId);
				const user = await this.Users.findOneById(userId);

				if (!team || !user) {
					return;
				}

				await addUserToRoom(team.roomId, user, inviter, false);
			}),
		);
	}

	async removeMemberFromTeams(userId: string, teamIds: Array<string>): Promise<void> {
		await Promise.all(
			teamIds.map(async (teamId) => {
				const team = await this.TeamModel.findOneById(teamId);
				const user = await this.Users.findOneById(userId);

				if (!team || !user) {
					return;
				}

				await removeUserFromRoom(team.roomId, user);
			}),
		);
	}

	async removeAllMembersFromTeam(teamId: string): Promise<void> {
		const team = await this.TeamModel.findOneById(teamId);

		if (!team) {
			return;
		}

		await this.TeamMembersModel.deleteByTeamId(team._id);
	}

	async addMember(inviter: Pick<IUser, '_id' | 'username'>, userId: string, teamId: string): Promise<boolean> {
		const isAlreadyAMember = await this.TeamMembersModel.findOneByUserIdAndTeamId(userId, teamId, {
			projection: { _id: 1 },
		});

		if (isAlreadyAMember) {
			return false;
		}

		let inviterData = {} as Pick<IUser, '_id' | 'username'>;
		if (inviter) {
			inviterData = { _id: inviter._id, username: inviter.username };
		}

		const member = (await this.TeamMembersModel.createOneByTeamIdAndUserId(teamId, userId, inviterData)).ops[0];
		await this.addMembersToDefaultRooms(inviter, teamId, [member]);

		return true;
	}

	getAllPublicTeams(): Promise<ITeam[]>;

	getAllPublicTeams(options: WithoutProjection<FindOneOptions<ITeam>>): Promise<ITeam[]>;

	getAllPublicTeams<P>(options: FindOneOptions<P extends ITeam ? ITeam : P>): Promise<P[]>;

	async getAllPublicTeams<P>(
		options?: undefined | WithoutProjection<FindOneOptions<ITeam>> | FindOneOptions<P extends ITeam ? ITeam : P>,
	): Promise<ITeam[] | P[]> {
		return options ? this.TeamModel.findByType(TEAM_TYPE.PUBLIC, options).toArray() : this.TeamModel.findByType(TEAM_TYPE.PUBLIC).toArray();
	}

	async getOneById<P>(teamId: string, options?: FindOneOptions<P extends ITeam ? ITeam : P>): Promise<ITeam | P | null> {
		if (options === undefined) {
			return this.TeamModel.findOneById(teamId);
		}
		return this.TeamModel.findOneById(teamId, options);
	}

	async getOneByName(teamName: string | RegExp): Promise<ITeam | null>;

	async getOneByName(teamName: string | RegExp, options: WithoutProjection<FindOneOptions<ITeam>>): Promise<ITeam | null>;

	async getOneByName<P>(teamName: string | RegExp, options: FindOneOptions<P>): Promise<P | null>;

	async getOneByName<P>(
		teamName: string | RegExp,
		options?: undefined | WithoutProjection<FindOneOptions<ITeam>> | FindOneOptions<P extends ITeam ? ITeam : P>,
	): Promise<ITeam | null | P> {
		if (!options) {
			return this.TeamModel.findOneByName(teamName);
		}
		return this.TeamModel.findOneByName(teamName, options);
	}

	async getOneByMainRoomId(roomId: string): Promise<Pick<ITeam, '_id'> | null> {
		return this.TeamModel.findOneByMainRoomId<Pick<ITeam, '_id'>>(roomId, {
			projection: { _id: 1 },
		});
	}

	async getOneByRoomId(roomId: string): Promise<ITeam | null> {
		const room = await this.RoomsModel.findOneById(roomId);

		if (!room) {
			throw new Error('invalid-room');
		}

		if (!room.teamId) {
			throw new Error('room-not-on-team');
		}

		return this.TeamModel.findOneById(room.teamId);
	}

	async addRolesToMember(teamId: string, userId: string, roles: Array<string>): Promise<boolean> {
		const isMember = await this.TeamMembersModel.findOneByUserIdAndTeamId(userId, teamId, {
			projection: { _id: 1 },
		});

		if (!isMember) {
			// TODO should this throw an error instead?
			return false;
		}

		return !!(await this.TeamMembersModel.updateRolesByTeamIdAndUserId(teamId, userId, roles));
	}

	async removeRolesFromMember(teamId: string, userId: string, roles: Array<string>): Promise<boolean> {
		const isMember = await this.TeamMembersModel.findOneByUserIdAndTeamId(userId, teamId, {
			projection: { _id: 1 },
		});

		if (!isMember) {
			// TODO should this throw an error instead?
			return false;
		}

		return !!(await this.TeamMembersModel.removeRolesByTeamIdAndUserId(teamId, userId, roles));
	}

	async getInfoByName(teamName: string): Promise<Omit<ITeam, 'usernames'> | null> {
		return this.TeamModel.findOne<Omit<ITeam, 'usernames'>>(
			{
				name: teamName,
			},
			{ projection: { usernames: 0 } },
		);
	}

	async getInfoById(teamId: string): Promise<Omit<ITeam, 'usernames'> | null> {
		return this.TeamModel.findOne<Omit<ITeam, 'usernames'>>(
			{
				_id: teamId,
			},
			{ projection: { usernames: 0 } },
		);
	}

	async addMembersToDefaultRooms(
		inviter: Pick<IUser, '_id' | 'username'>,
		teamId: string,
		members: Array<Partial<ITeamMember>>,
	): Promise<void> {
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
		return !!(await this.TeamModel.deleteOneById(teamId));
	}

	async deleteByName(teamName: string): Promise<boolean> {
		return !!(await this.TeamModel.deleteOneByName(teamName));
	}

	async getStatistics(): Promise<ITeamStats> {
		return {
			totalTeams: await this.TeamModel.find({}).count(),
			totalRoomsInsideTeams: await this.RoomsModel.findRoomsInsideTeams().count(),
			totalDefaultRoomsInsideTeams: await this.RoomsModel.findRoomsInsideTeams(true).count(),
		};
	}

	async autocomplete(uid: string, name: string): Promise<ITeamAutocompleteResult[]> {
		const nameRegex = new RegExp(`^${escapeRegExp(name).trim()}`, 'i');

		const subscriptions = await this.SubscriptionsModel.find<Pick<ISubscription, 'rid'>>(
			{ 'u._id': uid },
			{ projection: { rid: 1 } },
		).toArray();
		const subscriptionIds = subscriptions.map(({ rid }) => rid);

		const rooms = await this.RoomsModel.find<ITeamAutocompleteResult>(
			{
				teamMain: true,
				$and: [
					{
						$or: [
							{
								name: nameRegex,
							},
							{
								fname: nameRegex,
							},
						],
					},
					{
						$or: [
							{
								t: 'c',
							},
							{
								_id: { $in: subscriptionIds },
							},
						],
					},
				],
			},
			{
				projection: {
					fname: 1,
					teamId: 1,
					name: 1,
					t: 1,
					avatarETag: 1,
				},
				limit: 10,
				sort: {
					name: 1,
					fname: 1,
				},
			},
		).toArray();

		return rooms;
	}
}
