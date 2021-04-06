import { BaseRaw } from './BaseRaw';

export class RolesRaw extends BaseRaw {
	constructor(col, trash, models) {
		super(col, trash);

		this.models = models;
	}

	async isUserInRoles(userId, roles, scope) {
		if (!Array.isArray(roles)) {
			roles = [roles];
		}

		for (let i = 0, total = roles.length; i < total; i++) {
			const roleName = roles[i];

			// eslint-disable-next-line no-await-in-loop
			const role = await this.findOne({ _id: roleName }, { scope: 1 });
			const roleScope = (role && role.scope) || 'Users';
			const model = this.models[roleScope];

			// eslint-disable-next-line no-await-in-loop
			const permitted = await (model && model.isUserInRole && model.isUserInRole(userId, roleName, scope));
			if (permitted) {
				return true;
			}
		}
		return false;
	}
}
