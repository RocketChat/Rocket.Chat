import { Roles } from '../../../models';

export const getUsersInRole = (roleName, scope, options) => Roles.findUsersInRole(roleName, scope, options);
