import { settings } from '../../../../app/settings/server';
import type { IRole } from '../../../../definition/IRole';

export function getNewUserRoles(previousRoles?: IRole['_id'][]): IRole['_id'][] {
	const currentRoles = previousRoles ?? [];

	// This should convert names to ids
	const defaultUserRoles = String(settings.get('Accounts_Registration_Users_Default_Roles'))
		.split(',')
		.map((role) => role.trim())
		.filter(Boolean);

	return [...new Set([...currentRoles, ...defaultUserRoles])];
}
