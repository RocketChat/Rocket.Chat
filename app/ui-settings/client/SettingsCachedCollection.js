import { CachedCollection } from '../../ui-cached-collection';
import { Notifications } from '../../notifications/client';

export class PrivateSettingsCachedCollection extends CachedCollection {
	constructor() {
		super({
			name: 'private-settings',
			eventType: 'onLogged',
		});
	}

	async setupListener(eventType, eventName) {
		// private settings also need to listen to a change of authorizations for the setting-based authorizations
		Notifications[eventType || this.eventType](eventName || this.eventName, async (t, { _id, ...record }) => {
			this.log('record received', t, { _id, ...record });
			this.collection.upsert({ _id }, record);
			this.sync();
		});
	}
}
