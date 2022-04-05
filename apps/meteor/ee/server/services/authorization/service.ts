import '../../startup/broker';

import { api } from '../../../../server/sdk/api';
import { Authorization } from '../../../../server/services/authorization/service';
import { getConnection } from '../mongo';

getConnection().then((db) => {
	api.registerService(new Authorization(db));
});
