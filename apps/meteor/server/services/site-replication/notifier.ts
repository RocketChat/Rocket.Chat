import { api } from '@rocket.chat/core-services';
import type { IIntegration, IMessage, IPermission, IRole, IRoom, ISetting, ISubscription, IUser } from '@rocket.chat/core-typings';
import { Integrations, Messages, Permissions, Roles, Rooms, Settings, Subscriptions, Users } from '@rocket.chat/models';
import type { AppliedChange } from '@rocket.chat/site-replication';

import {
	notifyOnIntegrationChanged,
	notifyOnMessageChange,
	notifyOnPermissionChanged,
	notifyOnRoleChanged,
	notifyOnRoomChanged,
	notifyOnSettingChanged,
	notifyOnSubscriptionChanged,
	notifyOnUserChange,
} from '../../lib/notifyListener';

const userDiff = (change: AppliedChange) => ({
	diff: Object.fromEntries((change.set ?? []).filter(([path]) => !path.startsWith('services.'))),
	unset: Object.fromEntries((change.unset ?? []).map((path) => [path, 1 as const])),
});

/**
 * Publishes the peer site's writes to this site's clients and caches, as if they had been made here.
 */
export const notifyReplicatedChanges = async (changes: AppliedChange[]): Promise<void> => {
	for (const change of changes) {
		const record = change.doc ?? change.before;
		if (!record) {
			continue;
		}
		const { action } = change;
		switch (change.coll) {
			case Messages.getCollectionName():
				if (action === 'removed') {
					void api.broadcast('notify.deleteMessage', (record as IMessage).rid, { _id: change.id });
				} else {
					void notifyOnMessageChange({ id: change.id, data: record as IMessage });
				}
				break;
			case Rooms.getCollectionName():
				void notifyOnRoomChanged(record as IRoom, action);
				break;
			case Subscriptions.getCollectionName():
				void notifyOnSubscriptionChanged(record as ISubscription, action);
				break;
			case Users.getCollectionName():
				if (action === 'updated') {
					void notifyOnUserChange({ clientAction: action, id: change.id, ...userDiff(change) });
				} else {
					void notifyOnUserChange({ clientAction: action, id: change.id, data: record as IUser });
				}
				break;
			case Settings.getCollectionName():
				void notifyOnSettingChanged(record as ISetting, action);
				break;
			case Roles.getCollectionName():
				void notifyOnRoleChanged(record as IRole, action === 'removed' ? 'removed' : 'changed');
				break;
			case Permissions.getCollectionName():
				void notifyOnPermissionChanged(record as IPermission, action);
				break;
			case Integrations.getCollectionName():
				void notifyOnIntegrationChanged(record as IIntegration, action);
				break;
		}
	}
};
