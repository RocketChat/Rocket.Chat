import { settings } from '../../../../app/settings/server';
import type { IRole } from '../../../../definition/IRole';
import { parseCSV } from '../../../../lib/utils/parseCSV';

export function getNewUserRoles(previousRoles?: IRole['_id'][]): IRole['_id'][] {
	const currentRoles = previousRoles ?? [];

	const defaultUserRoles = parseCSV(settings.get<string>('Accounts_Registration_Users_Default_Roles') || '');

	return [...new Set([...currentRoles, ...defaultUserRoles])];
}
