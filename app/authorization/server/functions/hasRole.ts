import { Roles } from '../../../models/server/raw';
import { ISubscription } from '../../../../definition/ISubscription';

export const hasAnyRoleAsync = async (userId: string, roleNames: string[], scope?: string | undefined): Promise<boolean> => {
	if (!userId || userId === '') {
		return false;
	}

	return Roles.isUserInRoles(userId, roleNames, scope);
};

export const hasRole = (userId: string, roleNames: string, scope?: string | undefined): boolean =>
	Promise.await(hasAnyRoleAsync(userId, [roleNames], scope));

export const hasAnyRole = (userId: string, roleNames: string[], scope?: string | undefined): boolean =>
	Promise.await(hasAnyRoleAsync(userId, roleNames, scope));

export const subscriptionHasRole = (sub: ISubscription, role: string): boolean | undefined => sub.roles && sub.roles.includes(role);
