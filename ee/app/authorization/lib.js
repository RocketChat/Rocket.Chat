import { AuthorizationUtils } from '../../../app/authorization';

const oldIsRoleReadOnly = AuthorizationUtils.isRoleReadOnly;
AuthorizationUtils.isRoleReadOnly = function(roleId) {
	if (roleId === 'guest') {
		return true;
	}

	return oldIsRoleReadOnly(roleId);
};
