import { api, dbWatchersDisabled } from '@rocket.chat/core-services';
import type { IRole } from '@rocket.chat/core-typings';
import { Roles } from '@rocket.chat/models';

type ClientAction = 'inserted' | 'updated' | 'removed';

export async function notifyListenerOnRoleChanges(
	rid: IRole['_id'],
	clientAction: ClientAction = 'updated',
	existingRoleData?: IRole,
): Promise<void> {
	if (!dbWatchersDisabled) {
		return;
	}

	const role = existingRoleData || (await Roles.findOneById(rid));

	if (role) {
		void api.broadcast('watch.roles', {
			clientAction,
			role,
		});
	}
}
