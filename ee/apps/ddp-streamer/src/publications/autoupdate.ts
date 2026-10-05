import type { AutoUpdateRecord } from '@rocket.chat/core-services';

import { publishMeteorCollection } from './meteorCollection';
import type { Server } from '../ddp/Server';
import { MeteorCollection } from '../lib/MeteorCollection';

export type ClientVersion = Omit<AutoUpdateRecord, '_id'>;

const name = 'meteor_autoupdate_clientVersions';

export function registerAutoupdatePublication(server: Server): MeteorCollection<ClientVersion> {
	const collection = new MeteorCollection<ClientVersion>();
	publishMeteorCollection(server, name, name, collection);
	return collection;
}
