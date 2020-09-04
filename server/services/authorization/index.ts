import { api } from '../../sdk/api';
import { Authorization } from './service';
import { getConnection } from '../mongodb';

import '../../../ee/server/broker';

getConnection().then((db) => {
	console.log('registering');
	api.registerService(new Authorization(db));
});
