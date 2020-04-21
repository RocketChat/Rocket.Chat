import { AuthorizationUtils } from '../../../app/authorization';
import { isEnterprise } from '../license';

const oldIsRoleReadOnly = AuthorizationUtils.isRoleReadOnly;
AuthorizationUtils.isRoleReadOnly = function(roleId) {
	if (!isEnterprise()) {
		return oldIsRoleReadOnly(roleId);
	}

	if (roleId === 'guest') {
		return true;
	}

	return oldIsRoleReadOnly(roleId);
};
