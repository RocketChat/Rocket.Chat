import { AuthorizationUtils } from '../../authorization/lib';
import { explorerPermissions, novicePermissions } from './permissions';

export const addRoleEditRestriction = () => {
	AuthorizationUtils.addRolePermissionWhiteList('novice', novicePermissions);

	AuthorizationUtils.addRolePermissionWhiteList('explorer', novicePermissions.concat(explorerPermissions));
};
