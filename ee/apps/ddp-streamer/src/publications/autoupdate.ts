import type { AutoUpdateRecord } from '@rocket.chat/core-services';

import type { Server } from '../Server';
import { publishMirroredCollection } from './mirroredCollection';
import { MirroredCollection } from '../lib/MirroredCollection';

export type ClientVersion = Omit<AutoUpdateRecord, '_id'>;

const collection = 'meteor_autoupdate_clientVersions';

export function registerAutoupdatePublication(server: Server): MirroredCollection<ClientVersion> {
	const mirror = new MirroredCollection<ClientVersion>();
	publishMirroredCollection(server, collection, collection, mirror);
	return mirror;
}
