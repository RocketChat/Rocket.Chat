import type { ISetting } from '@rocket.chat/core-typings';

import { CachedCollection } from '../../../app/ui-cached-collection/client';
import { sdk } from '../../../app/utils/client/lib/SDKClient';

class PrivateSettingsCachedCollection extends CachedCollection<ISetting> {
	constructor() {
		super({
			name: 'private-settings',
			eventType: 'notify-logged',
		});
	}

	async setupListener(): Promise<void> {
		sdk.stream('notify-logged', [this.eventName as 'private-settings-changed'], async (t: string, { _id, ...record }: { _id: string }) => {
			this.log('record received', t, { _id, ...record });
			this.collection.update({ _id }, { $set: record }, { upsert: true });
			this.sync();
		});
	}
}

const instance = new PrivateSettingsCachedCollection();

export {
	/** @deprecated */
	instance as PrivateSettingsCachedCollection,
};
