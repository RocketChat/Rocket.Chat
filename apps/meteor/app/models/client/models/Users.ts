import type { IRole, IUser } from '@rocket.chat/core-typings';

import { MinimongoCollection } from '../../../../client/lib/cachedCollections/MinimongoCollection';

class UsersCollection extends MinimongoCollection<IUser> {
	isUserInRole(uid: IUser['_id'], roleId: IRole['_id']) {
		return this.state.get(uid)?.roles?.includes(roleId);
	}

	findUsersInRoles(roles: IRole['_id'][] | IRole['_id'], _scope: string, _options: any) {
		const rolesArray = Array.isArray(roles) ? roles : [roles];
		const result = this.state.filter((record) => record.roles?.some((roleId) => rolesArray.includes(roleId)));
		return result;
	}
}

const collection = new UsersCollection();

/** @deprecated prefer fetching data from the REST API, listening to changes via streamer events, and storing the state in a Tanstack Query */
export const Users = {
	use: collection.use,
	get state() {
		return this.use.getState();
	},
	isUserInRole: (uid: IUser['_id'], roleId: IRole['_id']) => Users.state.get(uid)?.roles?.includes(roleId),
	// TODO: remove options and scope from `findUsersInRoles` type.
	findUsersInRoles: (roles: IRole['_id'][] | IRole['_id'], _scope: string, _options: any) => {
		const rolesArray = Array.isArray(roles) ? roles : [roles];
		const result = Users.state.filter((record) => record.roles?.some((roleId) => rolesArray.includes(roleId)));
		return result;
	},
	collection,
};
