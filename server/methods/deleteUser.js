import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { Users } from '../../app/models';
import { hasPermission } from '../../app/authorization';
import { deleteUser } from '../../app/lib';
import { getUserLevelUser, getUserLevelById } from '../../app/authorization/server/functions/getUserLevel';

Meteor.methods({
	deleteUser(userId) {
		check(userId, String);
		const uid = Meteor.userId();
		if (!uid) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'deleteUser',
			});
		}

		if (!hasPermission(uid, 'delete-user')) {
			throw new Meteor.Error('error-not-allowed', 'Not allowed', {
				method: 'deleteUser',
			});
		}

		const user = Users.findOneById(userId);
		if (!user) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user to delete', {
				method: 'deleteUser',
			});
		}

		const editorUserLevel = getUserLevelById(uid);
		const editedUserLevel = getUserLevelUser(user);

		if (editorUserLevel < editedUserLevel) {
			throw new Meteor.Error('error-action-not-allowed', 'You cant change higher users', {
				method: 'authorization:removeUserFromRole',
				action: 'Accessing_permissions',
			});
		}

		const adminCount = Meteor.users.find({ roles: 'admin' }).count();

		const userIsAdmin = ~user.roles.indexOf('admin');

		if (adminCount === 1 && userIsAdmin) {
			throw new Meteor.Error('error-action-not-allowed', 'Leaving the app without admins is not allowed', {
				method: 'deleteUser',
				action: 'Remove_last_admin',
			});
		}

		deleteUser(userId);

		return true;
	},
});
