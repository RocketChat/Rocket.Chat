import { AuthorizationUtils } from '../../../../app/authorization/server/lib/AuthorizationUtils';
import { isEnterprise } from '../../license/server';

const { isRoleReadOnly: oldIsRoleReadOnly } = AuthorizationUtils;

AuthorizationUtils.isRoleReadOnly = function(roleId: string): boolean {
	if (isEnterprise() && roleId === 'guest') {
		return true;
	}

	return oldIsRoleReadOnly(roleId);
};
