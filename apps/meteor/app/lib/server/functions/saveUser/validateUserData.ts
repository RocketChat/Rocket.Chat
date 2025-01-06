import { MeteorError } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import { makeFunction } from '@rocket.chat/patch-injection';
import escape from 'lodash.escape';

import { trim } from '../../../../../lib/utils/stringUtils';
import { getRoleIds } from '../../../../authorization/server/functions/getRoles';
import { hasPermissionAsync } from '../../../../authorization/server/functions/hasPermission';
import { settings } from '../../../../settings/server';
import { checkEmailAvailability } from '../checkEmailAvailability';
import { checkUsernameAvailability } from '../checkUsernameAvailability';
import type { SaveUserData } from './saveUser';
import { isUpdateUserData } from './saveUser';

export const validateUserData = makeFunction(async (userId: IUser['_id'], userData: SaveUserData): Promise<void> => {
	const existingRoles = await getRoleIds();

	if (userData.verified && userData._id && userId === userData._id) {
		throw new MeteorError('error-action-not-allowed', 'Editing email verification is not allowed', {
			method: 'insertOrUpdateUser',
			action: 'Editing_user',
		});
	}

	if (isUpdateUserData(userData) && userId !== userData._id && !(await hasPermissionAsync(userId, 'edit-other-user-info'))) {
		throw new MeteorError('error-action-not-allowed', 'Editing user is not allowed', {
			method: 'insertOrUpdateUser',
			action: 'Editing_user',
		});
	}

	if (!isUpdateUserData(userData) && !(await hasPermissionAsync(userId, 'create-user'))) {
		throw new MeteorError('error-action-not-allowed', 'Adding user is not allowed', {
			method: 'insertOrUpdateUser',
			action: 'Adding_user',
		});
	}

	if (userData.roles) {
		const newRoles = userData.roles.filter((roleId) => !existingRoles.includes(roleId));
		if (newRoles.length > 0) {
			throw new MeteorError('error-action-not-allowed', 'The field Roles consist invalid role id', {
				method: 'insertOrUpdateUser',
				action: 'Assign_role',
			});
		}
	}

	if (userData.roles?.includes('admin') && !(await hasPermissionAsync(userId, 'assign-admin-role'))) {
		throw new MeteorError('error-action-not-allowed', 'Assigning admin is not allowed', {
			method: 'insertOrUpdateUser',
			action: 'Assign_admin',
		});
	}

	if (settings.get('Accounts_RequireNameForSignUp') && !isUpdateUserData(userData) && !trim(userData.name)) {
		throw new MeteorError('error-the-field-is-required', 'The field Name is required', {
			method: 'insertOrUpdateUser',
			field: 'Name',
		});
	}

	if (!isUpdateUserData(userData) && !trim(userData.username)) {
		throw new MeteorError('error-the-field-is-required', 'The field Username is required', {
			method: 'insertOrUpdateUser',
			field: 'Username',
		});
	}

	let nameValidation;

	try {
		nameValidation = new RegExp(`^${settings.get('UTF8_User_Names_Validation')}$`);
	} catch (e) {
		nameValidation = new RegExp('^[0-9a-zA-Z-_.]+$');
	}

	if (userData.username && !nameValidation.test(userData.username)) {
		throw new MeteorError('error-input-is-not-a-valid-field', `${escape(userData.username)} is not a valid username`, {
			method: 'insertOrUpdateUser',
			input: userData.username,
			field: 'Username',
		});
	}

	if (!isUpdateUserData(userData) && !userData.password && !userData.setRandomPassword) {
		throw new MeteorError('error-the-field-is-required', 'The field Password is required', {
			method: 'insertOrUpdateUser',
			field: 'Password',
		});
	}

	if (!isUpdateUserData(userData)) {
		if (userData.username && !(await checkUsernameAvailability(userData.username))) {
			throw new MeteorError('error-field-unavailable', `${escape(userData.username)} is already in use :(`, {
				method: 'insertOrUpdateUser',
				field: userData.username,
			});
		}

		if (userData.email && !(await checkEmailAvailability(userData.email))) {
			throw new MeteorError('error-field-unavailable', `${escape(userData.email)} is already in use :(`, {
				method: 'insertOrUpdateUser',
				field: userData.email,
			});
		}
	}
});
