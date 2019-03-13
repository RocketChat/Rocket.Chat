import { Meteor } from 'meteor/meteor';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { hasPermission } from '/app/authorization';
import { Rooms, Users } from '/app/models';
import s from 'underscore.string';

import { Federation } from '/app/federation';

const sortChannels = function(field, direction) {
	switch (field) {
		case 'createdAt':
			return {
				ts: direction === 'asc' ? 1 : -1,
			};
		default:
			return {
				[field]: direction === 'asc' ? 1 : -1,
			};
	}
};

const sortUsers = function(field, direction) {
	switch (field) {
		default:
			return {
				[field]: direction === 'asc' ? 1 : -1,
			};
	}
};

Meteor.methods({
	browseChannels({ text = '', workspace = '', type = 'channels', sortBy = 'name', sortDirection = 'asc', page, offset, limit = 10 }) {
		const regex = new RegExp(s.trim(s.escapeRegExp(text)), 'i');

		if (!['channels', 'users'].includes(type)) {
			return;
		}

		if (!['asc', 'desc'].includes(sortDirection)) {
			return;
		}

		if ((!page && page !== 0) && (!offset && offset !== 0)) {
			return;
		}

		if (!['name', 'createdAt', 'usersCount', ...type === 'channels' ? ['usernames'] : [], ...type === 'users' ? ['username'] : []].includes(sortBy)) {
			return;
		}

		const skip = Math.max(0, offset || (page > -1 ? limit * page : 0));

		limit = limit > 0 ? limit : 10;

		const options = {
			skip,
			limit,
		};

		const user = Meteor.user();

		if (type === 'channels') {
			const sort = sortChannels(sortBy, sortDirection);
			if (!hasPermission(user._id, 'view-c-room')) {
				return;
			}

			const result = Rooms.findByNameAndType(regex, 'c', {
				...options,
				sort,
				fields: {
					description: 1,
					topic: 1,
					name: 1,
					lastMessage: 1,
					ts: 1,
					archived: 1,
					usersCount: 1,
				},
			});

			return {
				total: result.count(), // count ignores the `skip` and `limit` options
				results: result.fetch(),
			};
		}

		// type === users
		if (!hasPermission(user._id, 'view-outside-room') || !hasPermission(user._id, 'view-d-room')) {
			return;
		}

		let exceptions = [user.username];

		// Get exceptions
		if (type === 'users' && workspace === 'all') {
			const nonFederatedUsers = Users.find({
				$or: [
					{ federation: { $exists: false } },
					{ 'federation.peer': Federation.localIdentifier },
				],
			}, { fields: { username: 1 } }).map((u) => u.username);

			exceptions = exceptions.concat(nonFederatedUsers);
		} else if (type === 'users' && workspace === 'local') {
			const federatedUsers = Users.find({
				$and: [
					{ federation: { $exists: true } },
					{ 'federation.peer': { $ne: Federation.localIdentifier } },
				],
			}, { fields: { username: 1 } }).map((u) => u.username);

			exceptions = exceptions.concat(federatedUsers);
		}

		const sort = sortUsers(sortBy, sortDirection);

		const forcedSearchFields = workspace === 'all' && ['username', 'name', 'emails.address'];

		const result = Users.findByActiveUsersExcept(text, exceptions, {
			...options,
			sort,
			fields: {
				username: 1,
				name: 1,
				createdAt: 1,
				emails: 1,
				federation: 1,
			},
		}, forcedSearchFields);

		return {
			total: result.count(), // count ignores the `skip` and `limit` options
			results: result.fetch(),
		};
	},
});

DDPRateLimiter.addRule({
	type: 'method',
	name: 'browseChannels',
	userId(/* userId*/) {
		return true;
	},
}, 100, 100000);
