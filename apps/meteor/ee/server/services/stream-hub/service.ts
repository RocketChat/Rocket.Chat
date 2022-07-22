import '../../startup/broker';

import { api } from '../../../../server/sdk/api';
import { StreamHub } from './StreamHub';
import { getConnection } from '../mongo';
import { registerServiceModels } from '../../lib/registerServiceModels';

getConnection().then((db) => {
	registerServiceModels(db);

	api.registerService(new StreamHub());
});
