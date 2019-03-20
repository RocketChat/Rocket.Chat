import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import * as Models from '../../models';
import { ChatPermissions } from './lib/ChatPermissions';

function atLeastOne(permissions = [], scope, userId = undefined) {
	userId = userId || Meteor.userId();

	return permissions.some((permissionId) => {
		const permission = ChatPermissions.findOne(permissionId);
		const roles = (permission && permission.roles) || [];

		return roles.some((roleName) => {
			const role = Models.Roles.findOne(roleName);
			const roleScope = role && role.scope;
			const model = Models[roleScope];

			return model && model.isUserInRole && model.isUserInRole(userId, roleName, scope);
		});
	});
}

function all(permissions = [], scope, userId = undefined) {
	userId = userId || Meteor.userId();

	return permissions.every((permissionId) => {
		const permission = ChatPermissions.findOne(permissionId);
		const roles = (permission && permission.roles) || [];

		return roles.some((roleName) => {
			const role = Models.Roles.findOne(roleName);
			const roleScope = role && role.scope;
			const model = Models[roleScope];

			return model && model.isUserInRole && model.isUserInRole(userId, roleName, scope);
		});
	});
}

function _hasPermission(permissions, scope, strategy, userId = undefined) {
	userId = userId || Meteor.userId();
	if (!userId) {
		return false;
	}

	if (!Models.AuthzCachedCollection.ready.get()) {
		return false;
	}

	permissions = [].concat(permissions);
	return strategy(permissions, scope, userId);
}

Template.registerHelper('hasPermission', function(permission, scope) {
	return _hasPermission(permission, scope, atLeastOne);
});
Template.registerHelper('userHasAllPermission', function(userId, permission, scope) {
	return _hasPermission(permission, scope, all, userId);
});

export const hasAllPermission = (permissions, scope) => _hasPermission(permissions, scope, all);
export const hasAtLeastOnePermission = (permissions, scope) => _hasPermission(permissions, scope, atLeastOne);
export const userHasAllPermission = (permissions, scope, userId) => _hasPermission(permissions, scope, all, userId);
export const hasPermission = hasAllPermission;

