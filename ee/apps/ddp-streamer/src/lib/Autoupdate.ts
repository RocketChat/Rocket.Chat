import { EventEmitter } from 'events';

import type { AutoUpdateRecord } from '@rocket.chat/core-services';
import { MeteorService } from '@rocket.chat/core-services';
import { primeOnce } from '@rocket.chat/tools';

class AutoupdateSingleton extends EventEmitter {
	private versions = new Map<string, Omit<AutoUpdateRecord, '_id'>>();

	/**
	 * MeteorService lives in the monolith, which is not necessarily reachable while
	 * this process boots. `primeOnce` does not remember a failure, so the next
	 * subscriber loads them rather than being served an empty map forever, and
	 * `meteor.clientVersionUpdated` keeps them current from then on.
	 */
	public prime = primeOnce(async (): Promise<void> => {
		const versions = await MeteorService.getAutoUpdateClientVersions();

		Object.values(versions ?? {}).forEach((version) => this.updateVersion(version));
	});

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
