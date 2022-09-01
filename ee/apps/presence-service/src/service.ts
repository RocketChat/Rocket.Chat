import type { Document } from 'mongodb';

import '../../../../apps/meteor/ee/server/startup/broker';

import { api } from '../../../../apps/meteor/server/sdk/api';
import { Collections, getCollection, getConnection } from '../../../../apps/meteor/ee/server/services/mongo';
import { registerServiceModels } from '../../../../apps/meteor/ee/server/lib/registerServiceModels';

getConnection().then(async (db) => {
	const trash = await getCollection<Document>(Collections.Trash);

	registerServiceModels(db, trash);

	// need to import Presence service after models are registered
	const { Presence } = await import('@rocket.chat/presence');

	api.registerService(new Presence());
});
