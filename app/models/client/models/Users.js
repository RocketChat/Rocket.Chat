import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

export const Users = {
	isUserInRole(userId, roleName) {
		const query = {
			_id: userId,
		};

		const user = this.findOne(query, { fields: { roles: 1 } });
		return user && Array.isArray(user.roles) && user.roles.includes(roleName);
	},

	findUsersInRoles(roles, scope, options) {
		roles = [].concat(roles);

		const query = {
			roles: { $in: roles },
		};

		return this.find(query, options);
	},
};

// overwrite Meteor.users collection so records on it don't get erased whenever the client reconnects to websocket
Meteor.users = new Mongo.Collection(null);
Meteor.user = () => Meteor.users.findOne({ _id: Meteor.userId() });
