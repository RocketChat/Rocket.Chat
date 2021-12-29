import { Meteor } from 'meteor/meteor';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import s from 'underscore.string';
import mem from 'mem';
import { escapeRegExp } from '@rocket.chat/string-helpers';

import { hasPermission } from '../../app/authorization/server';
import { Rooms, Users, Subscriptions } from '../../app/models/server';
import { Rooms as RoomsRaw } from '../../app/models/server/raw';
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

const getChannelsAndGroups = (user, canViewAnon, searchTerm, sort, pagination) => {
	if ((!user && !canViewAnon) || (user && !hasPermission(user._id, 'view-c-room'))) {
		return;
	}

	const teams = Promise.await(Team.getAllPublicTeams());
	const publicTeamIds = teams.map(({ _id }) => _id);

	const userTeamsIds =
		Promise.await(Team.listTeamsBySubscriberUserId(user._id, { projection: { teamId: 1 } }))?.map(({ teamId }) => teamId) || [];
	const userRooms = user.__rooms;

	const cursor = Rooms.findByNameOrFNameAndRoomIdsIncludingTeamRooms(searchTerm, [...userTeamsIds, ...publicTeamIds], userRooms, {
		...pagination,
		sort: {
			featured: -1,
			...sort,
		},
		fields: {
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
	});
	const total = cursor.count(); // count ignores the `skip` and `limit` options
	const result = cursor.fetch();

	const teamIds = result.filter(({ teamId }) => teamId).map(({ teamId }) => teamId);
	const teamsMains = Promise.await(Team.listByIds([...new Set(teamIds)], { projection: { _id: 1, name: 1 } }));

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
};

const getChannelsCountForTeam = mem((teamId) => Promise.await(RoomsRaw.findByTeamId(teamId, { projection: { _id: 1 } }).count()), {
	maxAge: 2000,
});

const getTeams = (user, searchTerm, sort, pagination) => {
	if (!user) {
		return;
	}

	const userSubs = Subscriptions.cachedFindByUserId(user._id).fetch();
	const ids = userSubs.map((sub) => sub.rid);
	const result = Rooms.findContainingNameOrFNameInIdsAsTeamMain(searchTerm, ids, {
		...pagination,
		sort: {
			featured: -1,
			...sort,
		},
		fields: {
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

	const rooms = result.fetch().map((room) => ({
		...room,
		roomsCount: getChannelsCountForTeam(room.teamId),
	}));

	return {
		total: result.count(), // count ignores the `skip` and `limit` options
		results: rooms,
	};
};

const getUsers = async (user, text, workspace, sort, pagination) => {
	if (!user || !hasPermission(user._id, 'view-outside-room') || !hasPermission(user._id, 'view-d-room')) {
		return;
	}

	const forcedSearchFields = workspace === 'all' && ['username', 'name', 'emails.address'];

	const viewFullOtherUserInfo = hasPermission(user._id, 'view-full-other-user-info');

	const options = {
		...pagination,
		sort,
		fields: {
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

	let result;
	if (workspace === 'all') {
		result = Users.findByActiveUsersExcept(text, [], options, forcedSearchFields);
	} else if (workspace === 'external') {
		result = Users.findByActiveExternalUsersExcept(text, [], options, forcedSearchFields, getFederationDomain());
	} else {
		result = Users.findByActiveLocalUsersExcept(text, [], options, forcedSearchFields, getFederationDomain());
	}

	const total = result.count(); // count ignores the `skip` and `limit` options
	const results = result.fetch();

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
