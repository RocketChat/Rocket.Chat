import { Mongo } from 'meteor/mongo';
import { ReactiveVar } from 'meteor/reactive-var';

import * as Models from '..';

const Roles = Object.assign(new Mongo.Collection(null), {
	/**
	 * @param {IRole['_id']} roleId
	 * @param {IRoom['_id']} scope the value for the role scope (room id)
	 * @param {any} options
	 */
	findUsersInRole(roleId, scope, options) {
		const role = this.findOne(roleId);
		const roleScope = (role && role.scope) || 'Users';
		const model = Models[roleScope];
		return model && model.findUsersInRoles && model.findUsersInRoles(roleId, scope, options);
	},

	/**
	 * @param {string} userId
	 * @param {IRole['_id'][]} roles the list of role ids
	 * @param {IRoom['_id']} scope the value for the role scope (room id)
	 * @param {boolean} ignoreSubscriptions ignore the subscription role scope
	 */
	isUserInRoles(userId, roles, scope, ignoreSubscriptions = false) {
		roles = [].concat(roles);
		return roles.some((roleId) => {
			const role = this.findOne(roleId);
			const roleScope = ignoreSubscriptions ? 'Users' : (role && role.scope) || 'Users';
			const model = Models[roleScope];
			return model && model.isUserInRole && model.isUserInRole(userId, roleId, scope);
		});
	},

	ready: new ReactiveVar(false),
});

export { Roles };
