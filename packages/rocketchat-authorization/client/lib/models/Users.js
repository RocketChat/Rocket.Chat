import { RocketChat } from 'meteor/rocketchat:lib';
import _ from 'underscore';

if (_.isUndefined(RocketChat.models.Users)) {
	RocketChat.models.Users = {};
}

Object.assign(RocketChat.models.Users, {
	isUserInRole(userId, roleName) {
		const query = {
			_id: userId,
			roles: roleName,
		};

		return !_.isUndefined(this.findOne(query, { fields: { roles: 1 } }));
	},

	findUsersInRoles(roles, scope, options) {
		roles = [].concat(roles);

		const query = {
			roles: { $in: roles },
		};

		return this.find(query, options);
	},
});
