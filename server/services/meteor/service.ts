import { Meteor } from 'meteor/meteor';

import { ServiceClass } from '../../sdk/types/ServiceClass';
import { IMeteor, AutoUpdateRecord } from '../../sdk/types/IMeteor';
import { api } from '../../sdk/api';


const autoUpdateRecords = new Map<string, AutoUpdateRecord>();

Meteor.server.publish_handlers.meteor_autoupdate_clientVersions.call({
	added(_collection: string, id: string, version: AutoUpdateRecord) {
		autoUpdateRecords.set(id, version);
	},
	changed(_collection: string, id: string, version: AutoUpdateRecord) {
		autoUpdateRecords.set(id, version);
		api.broadcast('meteor.autoUpdateClientVersionChanged', { record: version });
	},
	onStop() {
		//
	},
	ready() {
		//
	},
});

export class MeteorService extends ServiceClass implements IMeteor {
	protected name = 'meteor';

	async getLastAutoUpdateClientVersions(): Promise<AutoUpdateRecord[]> {
		return [...autoUpdateRecords.values()];
	}
}
