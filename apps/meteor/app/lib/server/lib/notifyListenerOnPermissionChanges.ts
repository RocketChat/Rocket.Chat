import { api, dbWatchersDisabled } from '@rocket.chat/core-services';
import type { IPermission } from '@rocket.chat/core-typings';
import { Permissions } from '@rocket.chat/models';

import { notifyListenerOnSettingChanges } from './notifyListenerOnSettingChanges';

type ClientAction = 'inserted' | 'updated' | 'removed';

export async function notifyListenerOnPermissionChanges(pid: IPermission['_id'], clientAction: ClientAction = 'updated'): Promise<void> {
	if (!dbWatchersDisabled) {
		return;
	}

	const permission: Partial<IPermission> | null = clientAction === 'removed' ? { _id: pid, roles: [] } : await Permissions.findOneById(pid);

	if (permission) {
		void api.broadcast('permission.changed', {
			clientAction,
			data: permission,
		});
	}

	if (permission?.level === 'settings' && permission?.settingId) {
		void notifyListenerOnSettingChanges(permission.settingId);
	}
}
