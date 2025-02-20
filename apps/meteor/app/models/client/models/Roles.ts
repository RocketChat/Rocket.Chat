import type { IRole, IUser } from '@rocket.chat/core-typings';
import { Mongo } from 'meteor/mongo';
import { ReactiveVar } from 'meteor/reactive-var';

import { Subscriptions } from './Subscriptions';
import { Users } from './Users';
import type { MinimongoCollection } from '../../../../client/definitions/MinimongoCollection';

class RolesCollection extends Mongo.Collection<IRole> implements MinimongoCollection<IRole> {
	ready = new ReactiveVar(false);

	constructor() {
		super(null);
	}

	isUserInRoles(userId: IUser['_id'], roles: IRole['_id'][] | IRole['_id'], scope?: string, ignoreSubscriptions = false) {
		roles = Array.isArray(roles) ? roles : [roles];
		return roles.some((roleId) => {
			const role = this.findOne(roleId);
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
	}

	public declare _collection: MinimongoCollection<IRole>['_collection'];

	public declare queries: MinimongoCollection<IRole>['queries'];
}

/** @deprecated new code refer to Minimongo collections like this one; prefer fetching data from the REST API, listening to changes via streamer events, and storing the state in a Tanstack Query */
export const Roles = new RolesCollection();
