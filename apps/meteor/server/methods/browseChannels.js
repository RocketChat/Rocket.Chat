import { Meteor } from 'meteor/meteor';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import s from 'underscore.string';
import mem from 'mem';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import { Rooms, Users } from '@rocket.chat/models';

import { hasPermission } from '../../app/authorization/server';
import { Subscriptions } from '../../app/models/server';
import { settings } from '../../app/settings/server';
import { getFederationDomain } from '../../app/federation/server/lib/getFederationDomain';
import { isFederationEnabled } from '../../app/federation/server/lib/isFederationEnabled';
import { federationSearchUsers } from '../../app/federation/server/handler';
import { Team } from '../sdk';

const sortChannels = function (field, direction) {
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

const sortUsers = function (field, direction) {
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

async function getChannelsAndGroups(user, canViewAnon, searchTerm, sort, pagination) {
	if ((!user && !canViewAnon) || (user && !hasPermission(user._id, 'view-c-room'))) {
		return;
	}

	const teams = await Team.getAllPublicTeams();
	const publicTeamIds = teams.map(({ _id }) => _id);

	const userTeamsIds = (await Team.listTeamsBySubscriberUserId(user._id, { projection: { teamId: 1 } }))?.map(({ teamId }) => teamId) || [];
	const userRooms = user.__rooms;

	const { cursor, totalCount } = Rooms.findPaginatedByNameOrFNameAndRoomIdsIncludingTeamRooms(
		searchTerm ? new RegExp(searchTerm, 'i') : null,
		[...userTeamsIds, ...publicTeamIds],
		userRooms,
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
			},
		},
	);

	const [result, total] = await Promise.all([cursor.toArray(), totalCount]);

	const teamIds = result.filter(({ teamId }) => teamId).map(({ teamId }) => teamId);
	const teamsMains = await Team.listByIds([...new Set(teamIds)], { projection: { _id: 1, name: 1 } });

	const results = result.map((room) => {
		if (room.teamId) {
			const team = teamsMains.find((mainRoom) => mainRoom._id === room.teamId);
			if (team) {
				room.belongsTo = team.name;
			}
		}
		return room;
	});

	return {
		total,
		results,
	};
}

const getChannelsCountForTeam = mem((teamId) => Rooms.findByTeamId(teamId, { projection: { _id: 1 } }).count(), {
	maxAge: 2000,
});

async function getTeams(user, searchTerm, sort, pagination) {
	if (!user) {
		return;
	}

	const userSubs = Subscriptions.cachedFindByUserId(user._id).fetch();
	const ids = userSubs.map((sub) => sub.rid);
	const { cursor, totalCount } = Rooms.findPaginatedContainingNameOrFNameInIdsAsTeamMain(
		searchTerm ? new RegExp(searchTerm, 'i') : null,
		ids,
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
				teamMain: 1,
			},
		},
	);
	const results = await Promise.all(
		(
			await cursor.toArray()
		).map(async (room) => ({
			...room,
			roomsCount: await getChannelsCountForTeam(room.teamId),
		})),
	);

	return {
		total: await totalCount,
		results,
	};
}

async function findUsers({ text, sort, pagination, workspace, viewFullOtherUserInfo }) {
	const searchFields =
		workspace === 'all' ? ['username', 'name', 'emails.address'] : settings.get('Accounts_SearchFields').trim().split(',');

	const options = {
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

	if (workspace === 'all') {
		const { cursor, totalCount } = Users.findPaginatedByActiveUsersExcept(text, [], options, searchFields);
		const [results, total] = await Promise.all([cursor.toArray(), totalCount]);
		return {
			total,
			results,
		};
	}

	if (workspace === 'external') {
		const { cursor, totalCount } = Users.findPaginatedByActiveExternalUsersExcept(text, [], options, searchFields, getFederationDomain());
		const [results, total] = await Promise.all([cursor.toArray(), totalCount]);
		return {
			total,
			results,
		};
	}

	const { cursor, totalCount } = Users.findPaginatedByActiveLocalUsersExcept(text, [], options, searchFields, getFederationDomain());
	const [results, total] = await Promise.all([cursor.toArray(), totalCount]);
	return {
		total,
		results,
	};
}

const getUsers = async (user, text, workspace, sort, pagination) => {
	if (!user || !hasPermission(user._id, 'view-outside-room') || !hasPermission(user._id, 'view-d-room')) {
		return;
	}

	const viewFullOtherUserInfo = hasPermission(user._id, 'view-full-other-user-info');

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

Meteor.methods({
	async browseChannels({ text = '', workspace = '', type = 'channels', sortBy = 'name', sortDirection = 'asc', page, offset, limit = 10 }) {
		const searchTerm = s.trim(escapeRegExp(text));

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

		const user = Meteor.user();

		switch (type) {
			case 'channels':
				return getChannelsAndGroups(user, canViewAnonymous, searchTerm, sortChannels(sortBy, sortDirection), pagination);
			case 'teams':
				return getTeams(user, searchTerm, sortChannels(sortBy, sortDirection), pagination);
			case 'users':
				return getUsers(user, text, workspace, sortUsers(sortBy, sortDirection), pagination);
			default:
		}
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
