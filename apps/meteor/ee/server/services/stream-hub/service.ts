import '../../startup/broker';

import { api } from '../../../../server/sdk/api';
import { getConnection } from '../mongo';
import { registerServiceModels } from '../../lib/registerServiceModels';

getConnection().then(async (db) => {
	registerServiceModels(db);

	// need to import StreamHub service after models are registered
	const { StreamHub } = await import('./StreamHub');

	api.registerService(new StreamHub());
});
