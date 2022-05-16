import { Meteor } from 'meteor/meteor';
import { isRoleCreateProps } from '@rocket.chat/rest-typings';

import { settings } from '../../../settings/server';
import { hasPermission } from '../functions/hasPermission';
import { Roles } from '../../../models/server/raw';
import { methodDeprecationLogger } from '../../../lib/server/lib/deprecationWarningLogger';
import { updateRoleAsync } from '../../../../server/lib/roles/updateRole';
import { insertRoleAsync } from '../../../../server/lib/roles/insertRole';

Meteor.methods({
	async 'authorization:saveRole'(roleData: Record<string, unknown>) {
		methodDeprecationLogger.warn('authorization:saveRole will be deprecated in future versions of Rocket.Chat');
		const userId = Meteor.userId();

		if (!userId || !hasPermission(userId, 'access-permissions')) {
			throw new Meteor.Error('error-action-not-allowed', 'Accessing permissions is not allowed', {
				method: 'authorization:saveRole',
				action: 'Accessing_permissions',
			});
		}

		if (!isRoleCreateProps(roleData)) {
			throw new Meteor.Error('error-invalid-role-properties', 'The role properties are invalid.', {
				method: 'authorization:saveRole',
			});
		}

		const role = {
			description: roleData.description || '',
			...(roleData.mandatory2fa !== undefined && { mandatory2fa: roleData.mandatory2fa }),
			name: roleData.name,
			scope: roleData.scope || 'Users',
			protected: false,
		};

		const existingRole = await Roles.findOneByName(roleData.name, { projection: { _id: 1 } });
		const options = {
			broadcastUpdate: settings.get<boolean>('UI_DisplayRoles'),
		};

		if (existingRole) {
			return updateRoleAsync(existingRole._id, role, options);
		}

		return insertRoleAsync(role);
	},
});
