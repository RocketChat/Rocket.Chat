import '../../startup/broker';

import { api } from '../../../../server/sdk/api';
import { Authorization } from '../../../../server/services/authorization/service';
import { getConnection } from '../mongo';
import { registerServiceModels } from '../../lib/registerServiceModels';

getConnection().then((db) => {
	registerServiceModels(db);

	api.registerService(new Authorization(db));
});
