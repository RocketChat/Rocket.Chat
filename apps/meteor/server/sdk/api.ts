import { isRunningMs } from '../lib/isRunningMs';
import { Api } from './lib/Api';
import { LocalBroker } from './lib/LocalBroker';

export const api = new Api();

if (!isRunningMs()) {
	api.setBroker(new LocalBroker());
	api.start();
}
