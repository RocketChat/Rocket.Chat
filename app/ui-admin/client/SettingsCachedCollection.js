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

	async setupListener(eventType, eventName) {
		await super.setupListener(eventType, eventName);

		// private settings also need to listen to a change of authorizations for the setting-based authorizations
		Notifications[eventType || this.eventType](eventName || this.eventName, async (t, record) => {
			this.log('record received', t, record);
			if (t === 'auth') {
				if (hasAtLeastOnePermission('view-privileged-setting', 'edit-privileged-setting')
					|| hasAllPermission([`change-setting-${ record._id }`, 'manage-selected-settings'])) {
					delete record.$loki;
					this.collection.upsert({ _id: record._id }, _.omit(record, '_id'));
				} else {
					this.collection.remove(record._id);
					RoomManager.close(record.t + record.name);
				}

				this.save();
				await this.sync();
			}
		});
	}
}
