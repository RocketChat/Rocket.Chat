import { Presence } from '@rocket.chat/presence';

import '../../../../apps/meteor/ee/server/startup/broker';

import { api } from '../../../../apps/meteor/server/sdk/api';
import { getConnection } from '../../../../apps/meteor/ee/server/services/mongo';

getConnection().then((db) => {
	api.registerService(new Presence(db));
});
