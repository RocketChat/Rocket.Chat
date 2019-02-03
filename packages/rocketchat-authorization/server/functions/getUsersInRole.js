import { Roles } from 'meteor/rocketchat:models';

export const getUsersInRole = (roleName, scope, options) => Roles.findUsersInRole(roleName, scope, options);

