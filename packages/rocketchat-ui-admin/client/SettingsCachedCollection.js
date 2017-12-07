import _ from 'underscore';

export class PrivateSettingsCachedCollection extends RocketChat.CachedCollection {
	constructor() {
		super({
			name: 'private-settings',
			eventType: 'onLogged'
		});
	}

	setupListener(eventType, eventName) {
		super.setupListener(eventType, eventName);

		// private settings also need to listen to a change of authorizationsfor the setting-based authorizations
		RocketChat.Notifications[eventType || this.eventType](eventName || this.eventName, (t, record) => {
			this.log('record received', t, record);
			if (t === 'auth') {
				if (! (RocketChat.authz.hasAllPermission([`change-setting-${ record._id }`, 'manage-selected-settings'])
					|| RocketChat.authz.hasAtLeastOnePermission('view-privileged-setting', 'edit-privileged-setting'))) {
					this.collection.remove(record._id);
					RoomManager.close(record.t + record.name);
				} else {
					delete record.$loki;
					this.collection.upsert({_id: record._id}, _.omit(record, '_id'));
				}

				this.saveCache();
			}
		});
	}
}
