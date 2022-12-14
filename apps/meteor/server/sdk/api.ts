import { api, LocalBroker } from '@rocket.chat/core-sdk';

import { isRunningMs } from '../lib/isRunningMs';

export { api }; // TODO remove this export

if (!isRunningMs()) {
	api.setBroker(new LocalBroker());
	api.start();
}
