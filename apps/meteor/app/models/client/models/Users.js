import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

export const Users = {
	findOneById(userId, options = {}) {
		const query = {
			_id: userId,
		};

		return this.findOne(query, options);
	},

	/**
	 * @param {string} userId
	 * @param {IRole['_id']} roleId
	 */
	isUserInRole(userId, roleId) {
		const user = this.findOneById(userId, { fields: { roles: 1 } });
		return user && Array.isArray(user.roles) && user.roles.includes(roleId);
	},

	/**
	 * @param {IRole['_id'][]} roles the list of role ids
	 * @param {string} scope the value for the scope (room id)
	 * @param {any} options
	 */
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
