import _ from 'underscore';

import { CachedCollection } from '../../ui-cached-collection';
import { Notifications } from '../../notifications/client';
import { hasAllPermission, hasAtLeastOnePermission } from '../../authorization/client';
import { RoomManager } from '../../ui-utils/client';

export class PrivateSettingsCachedCollection extends CachedCollection {
	constructor() {
		super({
			name: 'private-settings',
			eventType: 'onLogged',
			useCache: false,
		});
	}

	setupListener(eventType, eventName) {
		super.setupListener(eventType, eventName);

		// private settings also need to listen to a change of authorizationsfor the setting-based authorizations
		Notifications[eventType || this.eventType](eventName || this.eventName, (t, record) => {
			this.log('record received', t, record);
			if (t === 'auth') {
				if (! (hasAllPermission([`change-setting-${ record._id }`, 'manage-selected-settings'])
					|| hasAtLeastOnePermission('view-privileged-setting', 'edit-privileged-setting'))) {
					this.collection.remove(record._id);
					RoomManager.close(record.t + record.name);
				} else {
					delete record.$loki;
					this.collection.upsert({ _id: record._id }, _.omit(record, '_id'));
				}

				this.saveCache();
			}
		});
	}
}
