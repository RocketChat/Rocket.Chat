import type { IRole, IUser } from '@rocket.chat/core-typings';

import type { MinimongoOptions, MinimongoSelector } from '../../../../client/lib/cachedCollections/MinimongoCollection';
import { MinimongoCollection } from '../../../../client/lib/cachedCollections/MinimongoCollection';

class UsersCollection extends MinimongoCollection<IUser> {
	findOneById<TOptions extends Omit<MinimongoOptions<IUser>, 'limit'>>(uid: IUser['_id'], options?: TOptions) {
		const query: MinimongoSelector<IUser> = {
			_id: uid,
		};

		return this.findOne(query, options);
	}

	isUserInRole(uid: IUser['_id'], roleId: IRole['_id']) {
		const user = this.findOneById(uid, { fields: { roles: 1 } });
		return user && Array.isArray(user.roles) && user.roles.includes(roleId);
	}

	findUsersInRoles(roles: IRole['_id'][] | IRole['_id'], _scope: string, options: any) {
		roles = Array.isArray(roles) ? roles : [roles];

		return this.find(
			{
				roles: { $in: roles },
			},
			options,
		);
	}
}

/** @deprecated new code refer to Minimongo collections like this one; prefer fetching data from the REST API, listening to changes via streamer events, and storing the state in a Tanstack Query */
export const Users = new UsersCollection();
