import { Team } from '@rocket.chat/core-services';
import type { IRoom, IUser } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Rooms, Users, Subscriptions } from '@rocket.chat/models';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import mem from 'mem';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { Meteor } from 'meteor/meteor';
import type { FindOptions, SortDirection } from 'mongodb';

import { hasPermissionAsync } from '../../app/authorization/server/functions/hasPermission';
import { federationSearchUsers } from '../../app/federation/server/handler';
import { getFederationDomain } from '../../app/federation/server/lib/getFederationDomain';
import { isFederationEnabled } from '../../app/federation/server/lib/isFederationEnabled';
import { settings } from '../../app/settings/server';
import { isTruthy } from '../../lib/isTruthy';
import { trim } from '../../lib/utils/stringUtils';

const sortChannels = (field: string, direction: 'asc' | 'desc'): Record<string, 1 | -1> => {
	switch (field) {
		case 'createdAt':
			return {
				ts: direction === 'asc' ? 1 : -1,
			};
		case 'lastMessage':
			return {
				'lastMessage.ts': direction === 'asc' ? 1 : -1,
			};
		default:
			return {
				[field]: direction === 'asc' ? 1 : -1,
			};
	}
};

const sortUsers = (field: string, direction: 'asc' | 'desc'): Record<string, SortDirection> => {
	switch (field) {
		case 'email':
			return {
				'emails.address': direction === 'asc' ? 1 : -1,
				'username': direction === 'asc' ? 1 : -1,
			};
		default:
			return {
				[field]: direction === 'asc' ? 1 : -1,
			};
	}
};

const getChannelsAndGroups = async (
	user: IUser & { __rooms?: IRoom['_id'][] },
	canViewAnon: boolean,
	searchTerm: string,
	sort: Record<string, number>,
	pagination: {
		skip: number;
		limit: number;
	},
) => {
	if ((!user && !canViewAnon) || (user && !(await hasPermissionAsync(user._id, 'view-c-room')))) {
		return;
	}

	const canViewAllPrivateRooms = await hasPermissionAsync(user._id, 'view-all-p-room');

	// get all teams (public & private)
	let allTeamIds: string[] = [];
	if (canViewAllPrivateRooms) {
		// can see all channels (public & private) under all the teams (public & private)
		const { records: allTeams } = await Team.listAll({ offset: 0, count: 1000 });
		allTeamIds = allTeams.map(({ _id }) => _id);
	} else {
		// can only see public and the subscripted channels and teams
		const teams = await Team.getAllPublicTeams();
		const publicTeamIds = teams.map(({ _id }) => _id);
		const userTeamsIds =
			(await Team.listTeamsBySubscriberUserId(user._id, { projection: { teamId: 1 } }))?.map(({ teamId }) => teamId) || [];
		allTeamIds = [...userTeamsIds, ...publicTeamIds];
	}

	const userSubscriptions = await Subscriptions.find({ 'u._id': user._id, 't': 'p' }, { projection: { rid: 1 } }).toArray();

	const userRooms = userSubscriptions.map(({ rid }) => rid);

	let additionalRooms: IRoom['_id'][] = [];
	if (canViewAllPrivateRooms) {
		try {
			// get all private rooms
			const cursor = await Rooms.findPrivateRoomsNotSubscribedByUser(userRooms);
			const rooms = await cursor.toArray();
			additionalRooms = rooms.map((room: IRoom) => room._id);
		} catch (error) {
			additionalRooms = [];
		}
	}

	const { cursor, totalCount } = Rooms.findPaginatedByNameOrFNameAndRoomIdsIncludingTeamRooms(
		searchTerm ? new RegExp(searchTerm, 'i') : null,
		allTeamIds,
		[...userRooms, ...additionalRooms],
		{
			...pagination,
			sort: {
				featured: -1,
				...sort,
			},
			projection: {
				t: 1,
				description: 1,
				topic: 1,
				name: 1,
				fname: 1,
				lastMessage: 1,
				ts: 1,
				archived: 1,
				default: 1,
				featured: 1,
				usersCount: 1,
				prid: 1,
				teamId: 1,
				federated: 1,
			},
		},
	);

	const [result, total] = await Promise.all([cursor.toArray(), totalCount]);

	const teamIds = result.map(({ teamId }) => teamId).filter(isTruthy);
	const teamsMains = await Team.listByIds([...new Set(teamIds)], { projection: { _id: 1, name: 1 } });

	const results = result.map((room) => {
		if (room.teamId) {
			const team = teamsMains.find((mainRoom) => mainRoom._id === room.teamId);
			if (team) {
				return { ...room, belongsTo: team.name };
			}
		}
		return room;
	});

	return {
		total,
		results,
	};
};

const getChannelsCountForTeam = mem((teamId) => Rooms.countByTeamId(teamId), {
	maxAge: 2000,
});

const getTeams = async (
	user: IUser,
	searchTerm: string,
	sort: Record<string, number>,
	pagination: {
		skip: number;
		limit: number;
	},
) => {
	if (!user) {
		return;
	}

	const canViewAllPrivateRooms = await hasPermissionAsync(user._id, 'view-all-p-room');

	let cursor;
	let totalCount;

	if (canViewAllPrivateRooms) {
		// User can see all teams
		const query = {
			teamMain: true,
			...(searchTerm
				? {
						$or: [{ name: searchTerm }, { fname: searchTerm }],
					}
				: {}),
		};

		const result = Rooms.findPaginated(query, {
			...pagination,
			sort: {
				featured: -1,
				...sort,
			},
			projection: {
				t: 1,
				description: 1,
				topic: 1,
				name: 1,
				fname: 1,
				lastMessage: 1,
				ts: 1,
				archived: 1,
				default: 1,
				featured: 1,
				usersCount: 1,
				prid: 1,
				teamId: 1,
				teamMain: 1,
			},
		});
		cursor = result.cursor;
		totalCount = result.totalCount;
	} else {
		// User can only see teams they are subscribed to
		const userSubs = await Subscriptions.findByUserId(user._id).toArray();
		const ids = userSubs.map((sub) => sub.rid);
		const result = Rooms.findPaginatedContainingNameOrFNameInIdsAsTeamMain(searchTerm ? new RegExp(searchTerm, 'i') : null, ids, {
			...pagination,
			sort: {
				featured: -1,
				...sort,
			},
			projection: {
				t: 1,
				description: 1,
				topic: 1,
				name: 1,
				fname: 1,
				lastMessage: 1,
				ts: 1,
				archived: 1,
				default: 1,
				featured: 1,
				usersCount: 1,
				prid: 1,
				teamId: 1,
				teamMain: 1,
			},
		});
		cursor = result.cursor;
		totalCount = result.totalCount;
	}
	const results = await Promise.all(
		(await cursor.toArray()).map(async (room) => ({
			...room,
			roomsCount: await getChannelsCountForTeam(room.teamId),
		})),
	);

	return {
		total: await totalCount,
		results,
	};
};

const findUsers = async ({
	text,
	sort,
	pagination,
	workspace,
	viewFullOtherUserInfo,
}: {
	text: string;
	sort: Record<string, SortDirection>;
	pagination: {
		skip: number;
		limit: number;
	};
	workspace: string;
	viewFullOtherUserInfo: boolean;
}) => {
	const searchFields =
		workspace === 'all' ? ['username', 'name', 'emails.address'] : settings.get<string>('Accounts_SearchFields').trim().split(',');

	const options: FindOptions<IUser> = {
		...pagination,
		sort,
		projection: {
			username: 1,
			name: 1,
			nickname: 1,
			bio: 1,
			createdAt: 1,
			...(viewFullOtherUserInfo && { emails: 1 }),
			federation: 1,
			avatarETag: 1,
		},
	};

	type FederatedUser =
		| IUser
		| {
				_id?: string;
				username?: string;
				name?: string;
				bio?: string;
				nickname?: string;
				emails?: string;
				federation?: unknown;
				isRemote: true;
		  };

	if (workspace === 'all') {
		const { cursor, totalCount } = Users.findPaginatedByActiveUsersExcept<FederatedUser>(text, [], options, searchFields);
		const [results, total] = await Promise.all([cursor.toArray(), totalCount]);
		return {
			total,
			results,
		};
	}

	if (workspace === 'external') {
		const { cursor, totalCount } = Users.findPaginatedByActiveExternalUsersExcept<FederatedUser>(
			text,
			[],
			options,
			searchFields,
			getFederationDomain(),
		);
		const [results, total] = await Promise.all([cursor.toArray(), totalCount]);
		return {
			total,
			results,
		};
	}

	const { cursor, totalCount } = Users.findPaginatedByActiveLocalUsersExcept<FederatedUser>(
		text,
		[],
		options,
		searchFields,
		getFederationDomain(),
	);
	const [results, total] = await Promise.all([cursor.toArray(), totalCount]);
	return {
		total,
		results,
	};
};

const getUsers = async (
	user: IUser | undefined,
	text: string,
	workspace: string,
	sort: Record<string, SortDirection>,
	pagination: {
		skip: number;
		limit: number;
	},
) => {
	if (!user || !(await hasPermissionAsync(user._id, 'view-outside-room')) || !(await hasPermissionAsync(user._id, 'view-d-room'))) {
		return;
	}

	const viewFullOtherUserInfo = await hasPermissionAsync(user._id, 'view-full-other-user-info');

	const { total, results } = await findUsers({ text, sort, pagination, workspace, viewFullOtherUserInfo });

	// Try to find federated users, when applicable
	if (isFederationEnabled() && workspace === 'external' && text.indexOf('@') !== -1) {
		const users = await federationSearchUsers(text);

		for (const user of users) {
			if (results.find((e) => e._id === user._id)) {
				continue;
			}

			// Add the federated user to the results
			results.unshift({
				_id: user._id,
				username: user.username,
				name: user.name,
				bio: user.bio,
				nickname: user.nickname,
				emails: user.emails,
				federation: user.federation,
				isRemote: true,
			});
		}
	}

	return {
		total,
		results,
	};
};

type BrowseChannelsParams = {
	text?: string;
	workspace?: string;
	type?: 'channels' | 'users' | 'teams' | string;
	sortBy?: 'name' | 'createdAt' | 'usersCount' | 'lastMessage' | 'usernames' | string;
	sortDirection?: 'asc' | 'desc';
	page?: number;
	offset?: number;
	limit?: number;
};

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		browseChannels: (params: BrowseChannelsParams) => Promise<unknown>;
	}
}

export const browseChannelsMethod = async (
	{
		text = '',
		workspace = '',
		type = 'channels',
		sortBy = 'name',
		sortDirection = 'asc',
		page = 0,
		offset = 0,
		limit = 10,
	}: BrowseChannelsParams,
	user: IUser | undefined | null,
) => {
	const searchTerm = trim(escapeRegExp(text));

	if (
		!['channels', 'users', 'teams'].includes(type) ||
		!['asc', 'desc'].includes(sortDirection) ||
		(!page && page !== 0 && !offset && offset !== 0)
	) {
		return;
	}

	const roomParams = ['channels', 'teams'].includes(type) ? ['usernames', 'lastMessage'] : [];
	const userParams = type === 'users' ? ['username', 'email', 'bio'] : [];

	if (!['name', 'createdAt', 'usersCount', ...roomParams, ...userParams].includes(sortBy)) {
		return;
	}

	const skip = Math.max(0, offset || (page > -1 ? limit * page : 0));

	limit = limit > 0 ? limit : 10;

	const pagination = {
		skip,
		limit,
	};

	const canViewAnonymous = !!settings.get('Accounts_AllowAnonymousRead');

	if (!user) {
		return;
	}

	switch (type) {
		case 'channels':
			return getChannelsAndGroups(user, canViewAnonymous, searchTerm, sortChannels(sortBy, sortDirection), pagination);
		case 'teams':
			return getTeams(user, searchTerm, sortChannels(sortBy, sortDirection), pagination);
		case 'users':
			return getUsers(user, text, workspace, sortUsers(sortBy, sortDirection), pagination);
		default:
	}
};

Meteor.methods<ServerMethods>({
	async browseChannels(params: BrowseChannelsParams) {
		return browseChannelsMethod(params, (await Meteor.userAsync()) as IUser | null);
	},
});

DDPRateLimiter.addRule(
	{
		type: 'method',
		name: 'browseChannels',
		userId(/* userId*/) {
			return true;
		},
	},
	100,
	100000,
);
