import type { IRole, IUser } from '@rocket.chat/core-typings';
import { Mongo } from 'meteor/mongo';

class UsersCollection extends Mongo.Collection<IUser> {
	constructor() {
		super(null);
	}

	findOneById<TOptions extends Omit<Mongo.Options<IUser>, 'limit'>>(uid: IUser['_id'], options?: TOptions) {
		const query: Mongo.Selector<IUser> = {
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

		const query: Mongo.Selector<IUser> = {
			roles: { $in: roles },
		};

		return this.find(query, options);
	}
}

/** @deprecated */
export const Users = new UsersCollection();
