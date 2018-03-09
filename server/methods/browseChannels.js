import s from 'underscore.string';

const sortChannels = function(field, direction) {
	switch (field) {
		case 'createdAt':
			return {
				ts: direction === 'asc' ? 1 : -1
			};
		default:
			return {
				[field]: direction === 'asc' ? 1 : -1
			};
	}
};

const sortUsers = function(field, direction) {
	switch (field) {
		default:
			return {
				[field]: direction === 'asc' ? 1 : -1
			};
	}
};


Meteor.methods({
	browseChannels({text='', type = 'channels', sortBy = 'name', sortDirection = 'asc', page = 0, limit = 10}) {
		const regex = new RegExp(s.trim(s.escapeRegExp(text)), 'i');

		if (!['channels', 'users'].includes(type)) {
			return;
		}

		if (!['asc', 'desc'].includes(sortDirection)) {
			return;
		}

		if (!['name', 'createdAt', ...type === 'channels'? ['usernames'] : [], ...type === 'users' ? ['username'] : []].includes(sortBy)) {
			return;
		}

		page = page > -1 ? page : 0;

		limit = limit > 0 ? limit : 10;

		const options = {
			skip: limit * page,
			limit
		};

		const user = Meteor.user();
		if (type === 'channels') {

			const sort = sortChannels(sortBy, sortDirection);
			if (!RocketChat.authz.hasPermission(user._id, 'view-c-room')) {
				return;
			}
			return RocketChat.models.Rooms.findByNameAndType(regex, 'c', {
				...options,
				sort,
				fields: {
					description: 1,
					name: 1,
					ts: 1,
					archived: 1,
					usernames: 1
				}
			}).fetch();
		}

		// type === users
		if (!RocketChat.authz.hasPermission(user._id, 'view-outside-room') || !RocketChat.authz.hasPermission(user._id, 'view-d-room')) {
			return;
		}
		const sort = sortUsers(sortBy, sortDirection);
		return RocketChat.models.Users.findByActiveUsersExcept(text, [user.username], {
			...options,
			sort,
			fields: {
				username: 1,
				name: 1,
				createdAt: 1,
				emails: 1
			}
		}).fetch();
	}
});

DDPRateLimiter.addRule({
	type: 'method',
	name: 'browseChannels',
	userId(/*userId*/) {
		return true;
	}
}, 100, 100000);
