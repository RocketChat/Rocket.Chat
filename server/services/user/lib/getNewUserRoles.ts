import { settings } from '../../../../app/settings/server';

export function getNewUserRoles(previousRoles?: string[]): string[] {
	const currentRoles = previousRoles ?? [];

	const defaultUserRoles = String(settings.get('Accounts_Registration_Users_Default_Roles'))
		.split(',')
		.map((role) => role.trim())
		.filter(Boolean);

	return [...new Set([...currentRoles, ...defaultUserRoles])];
}
