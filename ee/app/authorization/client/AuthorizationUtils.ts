import { AuthorizationUtils } from '../../../../app/authorization/client/lib/AuthorizationUtils';
import { isEnterprise } from '../../license/client';

const { isRoleReadOnly: oldIsRoleReadOnly } = AuthorizationUtils;

AuthorizationUtils.isRoleReadOnly = function(roleId: string): boolean {
	if (isEnterprise() && roleId === 'guest') {
		return true;
	}

	return oldIsRoleReadOnly(roleId);
};
