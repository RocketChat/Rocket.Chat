import type { AutoUpdateRecord } from '@rocket.chat/core-services';
import type { Server } from '@rocket.chat/ddp-server';
import { MeteorCollection, publishMeteorCollection } from '@rocket.chat/ddp-server';

export type ClientVersion = Omit<AutoUpdateRecord, '_id'>;

const name = 'meteor_autoupdate_clientVersions';

export function registerAutoupdatePublication(server: Server): MeteorCollection<ClientVersion> {
	const collection = new MeteorCollection<ClientVersion>();
	publishMeteorCollection(server, name, name, collection);
	return collection;
}
