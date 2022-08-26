import '../../startup/broker';

import { api } from '../../../../server/sdk/api';
import { Authorization } from '../../../../server/services/authorization/service';
import { getConnection } from '../mongo';
import { registerServiceModels } from '../../lib/registerServiceModels';

getConnection().then(({ database, trash }) => {
	registerServiceModels(database, trash);

	api.registerService(new Authorization(database));
});
