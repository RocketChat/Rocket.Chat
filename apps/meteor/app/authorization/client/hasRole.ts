import type { IUser, IRole, IRoom } from '@rocket.chat/core-typings';
import { Tracker } from 'meteor/tracker';

import { Roles, Subscriptions, Users } from '../../models/client';

const dependency = new Tracker.Dependency();

Roles.use.subscribe(() => {
	dependency.changed();
});

Subscriptions.use.subscribe(() => {
	dependency.changed();
});

Users.use.subscribe(() => {
	dependency.changed();
});

export const hasRole = (userId: IUser['_id'], roleId: IRole['_id'], scope?: IRoom['_id']): boolean => {
	dependency.depend();

	const roleScope = Roles.state.get(roleId)?.scope ?? 'Users';

	switch (roleScope) {
		case 'Subscriptions': {
			if (!scope) return false;

			const subscription = Subscriptions.state.find((record) => record.rid === scope);

			return subscription?.roles?.includes(roleId) ?? false;
		}

		case 'Users':
			return Users.state.get(userId)?.roles?.includes(roleId) ?? false;

		default:
			return false;
	}
};
