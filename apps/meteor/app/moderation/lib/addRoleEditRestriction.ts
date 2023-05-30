import { AuthorizationUtils } from '../../authorization/lib';
import { explorer, novice } from './permissions';

export const addRoleEditRestriction = () => {
	AuthorizationUtils.addRolePermissionWhiteList('novice', novice);

	AuthorizationUtils.addRolePermissionWhiteList('explorer', explorer);
};
