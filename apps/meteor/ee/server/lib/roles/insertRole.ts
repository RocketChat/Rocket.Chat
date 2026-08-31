import { api, MeteorError } from '@rocket.chat/core-services';
import type { IRole } from '@rocket.chat/core-typings';
import { Roles } from '@rocket.chat/models';

import { isValidRoleScope } from '../../../../lib/roles/isValidRoleScope';
import { notifyOnRoleChanged } from '../../../../server/lib/notifyListener';

type InsertRoleOptions = {
	broadcastUpdate?: boolean;
};

export const insertRoleAsync = async (roleData: Omit<IRole, '_id' | '_updatedAt'>, options: InsertRoleOptions = {}): Promise<IRole> => {
	const { name, scope, description, mandatory2fa } = roleData;

	if (await Roles.findOneByName(name)) {
		throw new MeteorError('error-duplicate-role-names-not-allowed', 'Role name already exists');
	}

	if (!isValidRoleScope(scope)) {
		throw new MeteorError('error-invalid-scope', 'Invalid scope');
	}

	const role = await Roles.createWithRandomId(name, scope, description, false, mandatory2fa);

	void notifyOnRoleChanged(role);

	if (options.broadcastUpdate) {
		void api.broadcast('user.roleUpdate', {
			type: 'changed',
			_id: role._id,
		});
	}

	return role;
};
