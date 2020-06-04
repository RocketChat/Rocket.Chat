/* eslint-disable  @typescript-eslint/explicit-function-return-type */
import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

import { IOptions, IUsersRepository } from '../../lib';

export const Users: IUsersRepository = {
	findOneById(userId: string, options: IOptions = {}) {
		const query = {
			_id: userId,
		};
		// @ts-ignore
		return this.findOne(query, options);
	},

	isUserInRole(userId: string, roleName: string) {
		const user = this.findOneById(userId, { fields: { roles: 1 } });
		return user && Array.isArray(user.roles) && user.roles.includes(roleName);
	},

	findUsersInRoles(roles: any, scope: string, options: IOptions) {
		roles = [].concat(roles);

		const query = {
			roles: { $in: roles },
		};
		// @ts-ignore
		return this.find(query, options);
	},
};

// overwrite Meteor.users collection so records on it don't get erased whenever the client reconnects to websocket
Meteor.users = new Mongo.Collection(null);
Meteor.user = () => Meteor.users.findOne({ _id: Meteor.userId() });
