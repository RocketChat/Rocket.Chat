import * as Models from '..';

import { BaseRaw } from './BaseRaw';

export class RolesRaw extends BaseRaw {
	async isUserInRoles(userId, roles, scope) {
		roles = [].concat(roles);

		for (let i = 0, total = roles.length; i < total; i++) {
			const roleName = roles[i];

			// eslint-disable-next-line no-await-in-loop
			const role = await this.findOne({ _id: roleName });
			const roleScope = (role && role.scope) || 'Users';
			const model = Models[roleScope];

			// eslint-disable-next-line no-await-in-loop
			const permitted = await (model && model.isUserInRole && model.isUserInRole(userId, roleName, scope));
			if (permitted) {
				return true;
			}
		}
		return false;
	}
}
