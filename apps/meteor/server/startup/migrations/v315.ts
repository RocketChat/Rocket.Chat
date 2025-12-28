import type { IPermission } from '@rocket.chat/core-typings';
import { Permissions } from '@rocket.chat/models';

import { upsertPermissions } from '../../../app/authorization/server/functions/upsertPermissions';
import { addMigration } from '../../lib/migrations';

addMigration({
	version: 315,
	name: 'Copy roles from add-team-channel permission to new create-team-channel, create-team-group and move-room-to-team permissions',
	async up() {
		// Calling upsertPermissions on purpose so that the new permissions are added before the migration runs
		await upsertPermissions();

		const addTeamChannelPermission = await Permissions.findOneById<Pick<IPermission, 'roles'>>('add-team-channel', {
			projection: { roles: 1 },
		});

		if (addTeamChannelPermission) {
			await Permissions.updateMany(
				{ _id: { $in: ['create-team-channel', 'create-team-group', 'move-room-to-team'] } },
				{ $set: { roles: addTeamChannelPermission.roles } },
			);

			await Permissions.deleteOne({ _id: 'add-team-channel' });
		}
	},
});
