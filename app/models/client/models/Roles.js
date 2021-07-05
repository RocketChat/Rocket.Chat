import { Mongo } from 'meteor/mongo';
import { ReactiveVar } from 'meteor/reactive-var';

import * as Models from '..';

const Roles = new Mongo.Collection(null);

Object.assign(Roles, {
	findUsersInRole(name, scope, options) {
		const role = this.findOne(name);
		const roleScope = (role && role.scope) || 'Users';
		const model = Models[roleScope];
		return model && model.findUsersInRoles && model.findUsersInRoles(name, scope, options);
	},

	isUserInRoles(userId, roles, scope) {
		roles = [].concat(roles);
		return roles.some((roleName) => {
			const role = this.findOne(roleName);
			const roleScope = (role && role.scope) || 'Users';
			const model = Models[roleScope];
			return model && model.isUserInRole && model.isUserInRole(userId, roleName, scope);
		});
	},

	ready: new ReactiveVar(false),
});

export { Roles };
