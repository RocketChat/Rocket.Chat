import { hasAllPermission, hasAtLeastOnePermission, hasPermission, userHasAllPermission } from './hasPermission';
import { hasRole, hasAnyRole } from './hasRole';
import { AuthorizationUtils } from '../lib/AuthorizationUtils';
import './requiresPermission.html';
import './startup';

export { hasAllPermission, hasAtLeastOnePermission, hasRole, hasAnyRole, hasPermission, userHasAllPermission, AuthorizationUtils };
