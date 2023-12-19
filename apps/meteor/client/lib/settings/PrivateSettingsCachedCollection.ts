import type { ISetting } from '@rocket.chat/core-typings';

import { Notifications } from '../../../app/notifications/client';
import { CachedCollection } from '../../../app/ui-cached-collection/client';

class PrivateSettingsCachedCollection extends CachedCollection<ISetting> {
	constructor() {
		super({
			name: 'private-settings',
			eventType: 'onLogged',
		});
	}

	async setupListener(): Promise<void> {
		Notifications.onLogged(this.eventName as 'private-settings-changed', async (t: string, { _id, ...record }: { _id: string }) => {
			this.log('record received', t, { _id, ...record });
			await this.collection.upsertAsync({ _id }, record);
			this.sync();
		});
	}
}

const instance = new PrivateSettingsCachedCollection();

export {
	/** @deprecated */
	instance as PrivateSettingsCachedCollection,
};
