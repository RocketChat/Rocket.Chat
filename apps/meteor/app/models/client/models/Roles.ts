import type { IRole, IUser } from '@rocket.chat/core-typings';

import { Subscriptions } from './Subscriptions';
import { Users } from './Users';
import { createDocumentMapStore } from '../../../../client/lib/cachedCollections/DocumentMapStore';

/** @deprecated prefer fetching data from the REST API, listening to changes via streamer events, and storing the state in a Tanstack Query */
export const Roles = {
	use: createDocumentMapStore<IRole>(),
	get state() {
		return Roles.use.getState();
	},
	isUserInRoles: (userId: IUser['_id'], roles: IRole['_id'][] | IRole['_id'], scope?: string, ignoreSubscriptions = false) => {
		roles = Array.isArray(roles) ? roles : [roles];
		return roles.some((roleId) => {
			const role = Roles.state.get(roleId);
			const roleScope = ignoreSubscriptions ? 'Users' : role?.scope || 'Users';

			switch (roleScope) {
				case 'Subscriptions':
					return Subscriptions.isUserInRole(userId, roleId, scope);

				case 'Users':
					return Users.isUserInRole(userId, roleId);

				default:
					return false;
			}
		});
	},
};
