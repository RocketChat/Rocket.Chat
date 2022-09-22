import type { Document } from 'mongodb';

import '../../startup/broker';

import { api } from '../../../../server/sdk/api';
import { Collections, getCollection, getConnection } from '../mongo';
import { registerServiceModels } from '../../lib/registerServiceModels';

getConnection().then(async (db) => {
	const trash = await getCollection<Document>(Collections.Trash);

	registerServiceModels(db, trash);

	// need to import StreamHub service after models are registered
	const { StreamHub } = await import('./StreamHub');

	api.registerService(new StreamHub());
});
