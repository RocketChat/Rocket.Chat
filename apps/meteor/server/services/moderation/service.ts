import { ServiceClassInternal } from '@rocket.chat/core-services';
import type { IModerationService } from '@rocket.chat/core-services';
import { Permissions, Roles, Users } from '@rocket.chat/models';

import { createOrUpdateProtectedRoleAsync } from '../../lib/roles/createOrUpdateProtectedRole';
import { explorerPermissions as explorerExplicitPermissions, novicePermissions, trustRoles } from '../../../app/moderation/lib/permissions';
import { Logger } from '../../lib/logger/Logger';

export class ModerationService extends ServiceClassInternal implements IModerationService {
	protected name = 'moderation';

	private logger = new Logger('Moderation');

	async removeTrustRoles(): Promise<void> {
		const role = await Roles.findOneById(trustRoles[0], { projection: { _id: 1 } });
		if (!role) {
			return;
		}
		// remove all role mentions from user records that have it
		// TODO: move to models
		try {
			await Users.updateMany({ roles: { $in: trustRoles } }, { $pullAll: { roles: trustRoles as unknown as string[] } });
			await Permissions.updateMany({ roles: { $in: trustRoles } }, { $pullAll: { roles: trustRoles as unknown as string[] } });
			await Roles.deleteMany({ _id: { $in: trustRoles } });
		} catch (e) {
			this.logger.error('failed to remove trust roles completely', e);
		}
	}

	async addTrustRoles(): Promise<void> {
		// all roles exist at the same time, if one exists, the others do too
		// TODO: depending on how this method is called, this check may not be necessary
		const role = await Roles.findOneById(trustRoles[0], { projection: { _id: 1 } });
		if (role) {
			return;
		}
		try {
			await Promise.all(
				trustRoles.map((id) =>
					createOrUpdateProtectedRoleAsync(id, {
						name: id,
						scope: 'Users',
					}),
				),
			);
		} catch (e) {
			this.logger.error('failed to create trust roles', e);
			return;
		}

		try {
			await Promise.all([
				/*
				 * explorer has all permissions novice does
				 * and more, so we write to the same records only once
				 */
				Permissions.updateMany(
					{
						_id: { $in: novicePermissions },
					},
					{ $addToSet: { roles: { $each: trustRoles as unknown as string[] } } },
				),
				Permissions.updateMany(
					{
						_id: { $in: explorerExplicitPermissions },
					},
					{ $addToSet: { roles: 'explorer' } },
				),
			]);
		} catch (e) {
			this.logger.error('failed to set permissions to trust roles', e);
		}
	}
}
