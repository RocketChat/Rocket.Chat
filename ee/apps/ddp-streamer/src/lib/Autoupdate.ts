import { EventEmitter } from 'events';

import { AutoUpdateRecord } from '../../../../../apps/meteor/server/sdk/types/IMeteor';

class AutoupdateSingleton extends EventEmitter {
	private versions = new Map<string, Omit<AutoUpdateRecord, '_id'>>();

	public updateVersion(record: AutoUpdateRecord): void {
		const { _id, ...version } = record;
		this.versions.set(_id, version);

		this.emit('update', record);
	}

	public getVersions(): Map<string, Omit<AutoUpdateRecord, '_id'>> {
		return this.versions;
	}
}

export const Autoupdate = new AutoupdateSingleton();
