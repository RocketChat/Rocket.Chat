import { MeteorError } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

import type { UpdateUserData } from './saveUser';
import { hasPermissionAsync } from '../../../../authorization/server/functions/hasPermission';
import { settings } from '../../../../settings/server';

const isEditingUserRoles = (previousRoles: IUser['roles'], newRoles?: IUser['roles']) =>
	newRoles !== undefined &&
	(newRoles.some((item) => !previousRoles.includes(item)) || previousRoles.some((item) => !newRoles.includes(item)));
const isEditingField = (previousValue?: string, newValue?: string) => typeof newValue !== 'undefined' && newValue !== previousValue;

/**
 * Validate permissions to edit user fields
 *
 * @param {string} userId
 * @param {{ _id: string, roles?: string[], username?: string, name?: string, statusText?: string, email?: string, password?: string}} userData
 */
export async function validateUserEditing(userId: IUser['_id'], userData: UpdateUserData): Promise<void> {
	const editingMyself = userData._id && userId === userData._id;

	const canEditOtherUserInfo = await hasPermissionAsync(userId, 'edit-other-user-info');
	const canEditOtherUserPassword = await hasPermissionAsync(userId, 'edit-other-user-password');
	const user = await Users.findOneById(userData._id);

	if (!user) {
		throw new MeteorError('error-invalid-user', 'Invalid user');
	}

	if (isEditingUserRoles(user.roles, userData.roles) && !(await hasPermissionAsync(userId, 'assign-roles'))) {
		throw new MeteorError('error-action-not-allowed', 'Assign roles is not allowed', {
			method: 'insertOrUpdateUser',
			action: 'Assign_role',
		});
	}

	if (!settings.get('Accounts_AllowUserProfileChange') && !canEditOtherUserInfo && !canEditOtherUserPassword) {
		throw new MeteorError('error-action-not-allowed', 'Edit user profile is not allowed', {
			method: 'insertOrUpdateUser',
			action: 'Update_user',
		});
	}

	if (
		isEditingField(user.username, userData.username) &&
		!settings.get('Accounts_AllowUsernameChange') &&
		(!canEditOtherUserInfo || editingMyself)
	) {
		throw new MeteorError('error-action-not-allowed', 'Edit username is not allowed', {
			method: 'insertOrUpdateUser',
			action: 'Update_user',
		});
	}

	if (
		isEditingField(user.statusText, userData.statusText) &&
		!settings.get('Accounts_AllowUserStatusMessageChange') &&
		(!canEditOtherUserInfo || editingMyself)
	) {
		throw new MeteorError('error-action-not-allowed', 'Edit user status is not allowed', {
			method: 'insertOrUpdateUser',
			action: 'Update_user',
		});
	}

	if (
		isEditingField(user.name, userData.name) &&
		!settings.get('Accounts_AllowRealNameChange') &&
		(!canEditOtherUserInfo || editingMyself)
	) {
		throw new MeteorError('error-action-not-allowed', 'Edit user real name is not allowed', {
			method: 'insertOrUpdateUser',
			action: 'Update_user',
		});
	}

	if (
		user.emails?.[0] &&
		isEditingField(user.emails[0].address, userData.email) &&
		!settings.get('Accounts_AllowEmailChange') &&
		(!canEditOtherUserInfo || editingMyself)
	) {
		throw new MeteorError('error-action-not-allowed', 'Edit user email is not allowed', {
			method: 'insertOrUpdateUser',
			action: 'Update_user',
		});
	}

	if (userData.password && !settings.get('Accounts_AllowPasswordChange') && (!canEditOtherUserPassword || editingMyself)) {
		throw new MeteorError('error-action-not-allowed', 'Edit user password is not allowed', {
			method: 'insertOrUpdateUser',
			action: 'Update_user',
		});
	}
}
