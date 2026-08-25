import type { AutoUpdateRecord } from '@rocket.chat/core-services';
import { primeOnce } from '@rocket.chat/tools';

import { publishMeteorCollection } from './meteorCollection';
import type { Server } from '../ddp/Server';
import { MeteorCollection } from '../lib/MeteorCollection';

export type ClientVersion = Omit<AutoUpdateRecord, '_id'>;

export type LoadClientVersions = () => Promise<Record<string, AutoUpdateRecord> | undefined>;

export class ClientVersions extends MeteorCollection<ClientVersion> {
	/**
	 * The versions come from the monolith, which is not necessarily reachable while
	 * this process boots. `primeOnce` does not remember a failure, so the next
	 * subscriber loads them rather than being served an empty map forever, and
	 * `meteor.clientVersionUpdated` keeps them current from then on.
	 */
	readonly prime = primeOnce(async (): Promise<void> => {
		const versions = await this.load();

		Object.values(versions ?? {}).forEach(({ _id, ...version }) => this.set(_id, version));
	});

	constructor(private readonly load: LoadClientVersions) {
		super();
	}
}

const name = 'meteor_autoupdate_clientVersions';

export function registerAutoupdatePublication(server: Server, load: LoadClientVersions): ClientVersions {
	const collection = new ClientVersions(load);
	publishMeteorCollection(server, name, name, collection, () => collection.prime().catch(() => undefined));
	return collection;
}
