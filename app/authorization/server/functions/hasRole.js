import { Roles } from '../../../models/server/raw';

export const hasRoleAsync = async (userId, roleNames, scope) => {
	if (!userId || userId === '') {
		return false;
	}

	return Roles.isUserInRoles(userId, roleNames, scope);
};

export const hasRole = (userId, roleNames, scope) => Promise.await(hasRoleAsync(userId, roleNames, scope));

export const subscriptionHasRole = (sub, role) => sub.roles && sub.roles.includes(role);
