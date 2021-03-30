import { Meteor } from 'meteor/meteor';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import s from 'underscore.string';

import { hasPermission } from '../../app/authorization';
import { Rooms, Users, Subscriptions } from '../../app/models';
import { settings } from '../../app/settings/server';
import { getFederationDomain } from '../../app/federation/server/lib/getFederationDomain';
import { isFederationEnabled } from '../../app/federation/server/lib/isFederationEnabled';
import { federationSearchUsers } from '../../app/federation/server/handler';
import { escapeRegExp } from '../../lib/escapeRegExp';

const sortChannels = function(field, direction) {
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

const sortUsers = function(field, direction) {
	switch (field) {
		case 'email':
			return {
				'emails.address': direction === 'asc' ? 1 : -1,
				username: direction === 'asc' ? 1 : -1,
			};
		default:
			return {
				[field]: direction === 'asc' ? 1 : -1,
			};
	}
};

const getChannels = (user, canViewAnon, searchTerm, sort, pagination) => {
	if ((!user && !canViewAnon) || (user && !hasPermission(user._id, 'view-c-room'))) {
		return;
	}

	const result = Rooms.findByNameOrFNameAndType(searchTerm, 'c', {
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
		},
	});

	return {
		total: result.count(), // count ignores the `skip` and `limit` options
		results: result.fetch(),
	};
};

const getTeams = (user, searchTerm, sort, pagination) => {
	if (!user) {
		return;
	}

	const userSubs = Subscriptions.cachedFindByUserId(user._id).fetch();
	const ids = userSubs.map((sub) => sub.rid);
	const result = Rooms.findByNameOrFNameInIdsWithTeams(searchTerm, ids, {
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

	const rooms = result.fetch();
	const mainRooms = rooms.filter((room) => room.teamMain);

	const roomsWithTeamInfo = rooms.reduce((prev, room) => {
		const mainRoom = mainRooms.find((mr) => room.teamId === mr.teamId);
		room.teamName = mainRoom.name;

		return prev.push(room) && prev;
	}, []);

	return {
		total: result.count(), // count ignores the `skip` and `limit` options
		results: roomsWithTeamInfo,
	};
};

const getUsers = (user, text, workspace, sort, pagination) => {
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
			...viewFullOtherUserInfo && { emails: 1 },
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
		const users = federationSearchUsers(text);

		for (const user of users) {
			if (results.find((e) => e._id === user._id)) { continue; }

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
	browseChannels({ text = '', workspace = '', type = 'channels', sortBy = 'name', sortDirection = 'asc', page, offset, limit = 10 }) {
		const regex = new RegExp(s.trim(escapeRegExp(text)), 'i');

		if (!['channels', 'users', 'teams'].includes(type) || !['asc', 'desc'].includes(sortDirection) || ((!page && page !== 0) && (!offset && offset !== 0))) {
			return;
		}

		if (!['name', 'createdAt', 'usersCount', ['channels', 'teams'].includes(...type) ? ['usernames', 'lastMessage'] : [], ...type === 'users' ? ['username', 'email', 'bio'] : []].includes(sortBy)) {
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
				return getChannels(user, canViewAnonymous, regex, sortChannels(sortBy, sortDirection), pagination);
			case 'teams':
				return getTeams(user, regex, sortChannels(sortBy, sortDirection), pagination);
			case 'users':
				return getUsers(user, text, workspace, sortUsers(sortBy, sortDirection), pagination);
			default:
		}
	},
});

DDPRateLimiter.addRule({
	type: 'method',
	name: 'browseChannels',
	userId(/* userId*/) {
		return true;
	},
}, 100, 100000);
