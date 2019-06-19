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

// logged user data will come to this collection
const OwnUser = new Mongo.Collection('own_user');

// register an observer to logged user's collection and populate "original" Meteor.users with it
OwnUser.find().observe({
	added: (record) => Meteor.users.upsert({ _id: record._id }, record),
	changed: (record) => Meteor.users.update({ _id: record._id }, record),
	removed: (_id) => Meteor.users.remove({ _id }),
});
