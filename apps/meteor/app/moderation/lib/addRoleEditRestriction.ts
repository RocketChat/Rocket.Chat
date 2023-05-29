import { AuthorizationUtils } from '../../authorization/lib';
import { explorer, novice } from './permissions';

export const addRoleEditRestriction = async () => {
	AuthorizationUtils.addRolePermissionWhiteList('novice', novice);

	AuthorizationUtils.addRolePermissionWhiteList('explorer', explorer);
};
