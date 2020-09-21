import { hasAllPermission, hasAtLeastOnePermission, hasPermission, userHasAllPermission } from './hasPermission';
import { hasRole } from './hasRole';
import { AuthorizationUtils } from '../lib/AuthorizationUtils';
import './usersNameChanged';
import './requiresPermission.html';
import './startup';

export {
	hasAllPermission,
	hasAtLeastOnePermission,
	hasRole,
	hasPermission,
	userHasAllPermission,
	AuthorizationUtils,
};
