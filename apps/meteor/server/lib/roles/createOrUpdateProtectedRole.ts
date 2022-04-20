import type { IRole, AtLeast } from '@rocket.chat/core-typings';

import { Roles } from '../../../app/models/server/raw';

export const createOrUpdateProtectedRoleAsync = async (
	roleId: string,
	roleData: AtLeast<Omit<IRole, '_id' | 'protected'>, 'name'>,
): Promise<void> => {
	const role = await Roles.findOneById<Pick<IRole, '_id' | 'name' | 'scope' | 'description' | 'mandatory2fa'>>(roleId, {
		projection: { name: 1, scope: 1, description: 1, mandatory2fa: 1 },
	});
	if (role) {
		await Roles.updateById(
			roleId,
			roleData.name || role.name,
			roleData.scope || role.scope,
			roleData.description || role.description,
			roleData.mandatory2fa || role.mandatory2fa,
		);

		return;
	}

	await Roles.insertOne({
		_id: roleId,
		scope: 'Users',
		description: '',
		mandatory2fa: false,
		...roleData,
		protected: true,
	});
};

export const createOrUpdateProtectedRole = (...args: Parameters<typeof createOrUpdateProtectedRoleAsync>): void =>
	Promise.await(createOrUpdateProtectedRoleAsync(...args));
