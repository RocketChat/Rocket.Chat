import { hasAllPermission, hasAtLeastOnePermission, hasPermission, userHasAllPermission } from './hasPermission';
import { hasRole } from './hasRole';
import { AuthorizationUtils } from './AuthorizationUtils';
import './usersNameChanged';
import './requiresPermission.html';
import './route';
import './startup';
import './stylesheets/permissions.css';
import { IAuthorization } from '../lib/IAuthorizationUtils';

export {
	hasAllPermission,
	hasAtLeastOnePermission,
	hasRole,
	hasPermission,
	userHasAllPermission,
	AuthorizationUtils,
	IAuthorization,
};
