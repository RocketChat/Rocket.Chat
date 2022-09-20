import type { Document } from 'mongodb';

import '../../startup/broker';

import { api } from '../../../../server/sdk/api';
import { Authorization } from '../../../../server/services/authorization/service';
import { Collections, getCollection, getConnection } from '../mongo';
import { registerServiceModels } from '../../lib/registerServiceModels';

getConnection().then(async (db) => {
	const trash = await getCollection<Document>(Collections.Trash);

	registerServiceModels(db, trash);

	api.registerService(new Authorization(db));
});
