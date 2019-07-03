import { Meteor } from 'meteor/meteor';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import s from 'underscore.string';

import { hasPermission } from '../../app/authorization';
import { Rooms, Users } from '../../app/models';
import { Federation } from '../../app/federation/server';
import { settings } from '../../app/settings/server';

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

const sortServiceAccounts = function(field, direction) {
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

		if (!['channels', 'users', 'serviceAccounts'].includes(type)) {
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

		const pagination = {
			skip,
			limit,
		};

		const canViewAnonymous = settings.get('Accounts_AllowAnonymousRead') === true;

		const user = Meteor.user();

		if (type === 'channels') {
			const sort = sortChannels(sortBy, sortDirection);
			if ((!user && !canViewAnonymous) || (user && !hasPermission(user._id, 'view-c-room'))) {
				return;
			}

			const result = Rooms.findByNameAndType(regex, 'c', {
				...pagination,
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

		if (type === 'serviceAccounts') {
			const options = {
				...pagination,
				sort: sortServiceAccounts(sortBy, sortDirection),
				fields: {
					username: 1,
					name: 1,
					createdAt: 1,
					description: 1,
					federation: 1,
				},
			};

			const exceptions = [user.username];
			const forcedSearchFields = workspace === 'all' && ['username', 'name', 'description'];

			let result;
			if (workspace === 'all') {
				result = Users.findByActiveServiceAccountsExcept(text, exceptions, forcedSearchFields, options);
			} else if (workspace === 'external') {
				result = Users.findByActiveExternalServiceAccountsExcept(text, exceptions, options, forcedSearchFields, Federation.localIdentifier);
			} else {
				result = Users.findByActiveLocalServiceAccountsExcept(text, exceptions, options, forcedSearchFields, Federation.localIdentifier);
			}
			const total = result.count();
			const results = result.fetch();
			results.forEach((account) => {
				account.subscribers = Rooms.findDirectRoomContainingUsername(account.username).count();
			});
			return {
				total,
				results,
			};
		}
		// non-logged id user
		if (!user) {
			return;
		}

		// type === users
		if (!hasPermission(user._id, 'view-outside-room') || !hasPermission(user._id, 'view-d-room')) {
			return;
		}

		const exceptions = [user.username];

		const forcedSearchFields = workspace === 'all' && ['username', 'name', 'emails.address'];

		const options = {
			...pagination,
			sort: sortUsers(sortBy, sortDirection),
			fields: {
				username: 1,
				name: 1,
				createdAt: 1,
				emails: 1,
				federation: 1,
			},
		};

		let result;
		if (workspace === 'all') {
			result = Users.findByActiveUsersExcept(text, exceptions, options, forcedSearchFields);
		} else if (workspace === 'external') {
			result = Users.findByActiveExternalUsersExcept(text, exceptions, options, forcedSearchFields, Federation.localIdentifier);
		} else {
			result = Users.findByActiveLocalUsersExcept(text, exceptions, options, forcedSearchFields, Federation.localIdentifier);
		}

		const total = result.count(); // count ignores the `skip` and `limit` options
		const results = result.fetch();

		// Try to find federated users, when appliable
		if (Federation.enabled && type === 'users' && workspace === 'external' && text.indexOf('@') !== -1) {
			const federatedUsers = Federation.methods.searchUsers(text);

			for (const federatedUser of federatedUsers) {
				const { user } = federatedUser;

				const exists = results.findIndex((e) => e.domain === user.federation.peer && e.username === user.username) !== -1;

				if (exists) { continue; }

				// Add the federated user to the results
				results.unshift({
					username: user.username,
					name: user.name,
					createdAt: user.createdAt,
					emails: user.emails,
					federation: user.federation,
				});
			}
		}

		return {
			total,
			results,
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
