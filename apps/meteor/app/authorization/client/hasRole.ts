import type { IUser, IRole, IRoom } from '@rocket.chat/core-typings';

import { watch } from '../../../client/lib/cachedStores';
import { Roles, Subscriptions, Users } from '../../../client/stores';

export const hasRole = (userId: IUser['_id'], roleId: IRole['_id'], scope?: IRoom['_id']): boolean => {
	const roleScope = watch(Roles.use, (state) => state.get(roleId)?.scope ?? 'Users');

	switch (roleScope) {
		case 'Subscriptions':
			if (!scope) return false;

			return watch(Subscriptions.use, (state) => state.find((record) => record.rid === scope)?.roles?.includes(roleId) ?? false);

		case 'Users':
			return watch(Users.use, (state) => state.get(userId)?.roles?.includes(roleId) ?? false);

		default:
			return false;
	}
};
