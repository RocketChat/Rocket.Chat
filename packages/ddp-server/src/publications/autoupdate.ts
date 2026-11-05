import type { AutoUpdateRecord } from '@rocket.chat/core-services';

import { publishMeteorCollection } from './meteorCollection';
import type { Server } from '../Server';
import { MeteorCollection } from '../lib/MeteorCollection';

export type ClientVersion = Omit<AutoUpdateRecord, '_id'>;

const name = 'meteor_autoupdate_clientVersions';

/** Stores a client version under its architecture, which is its DDP document id and so is not repeated in the fields. */
export function setClientVersion(collection: MeteorCollection<ClientVersion>, { _id, ...version }: AutoUpdateRecord): void {
	collection.set(_id, version);
}

export function registerAutoupdatePublication(server: Server): MeteorCollection<ClientVersion> {
	const collection = new MeteorCollection<ClientVersion>();
	publishMeteorCollection(server, name, name, collection);
	return collection;
}
