import { BaseRaw } from './BaseRaw';

export class UsersRaw extends BaseRaw {
	findUsersInRoles(roles, scope, options) {
		roles = [].concat(roles);

		const query = {
			roles: { $in: roles },
		};

		return this.find(query, options);
	}
}
