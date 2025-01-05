import { registerEEBroker } from '../../ee/server';
import { isRunningMs } from '../lib/isRunningMs';

if (!isRunningMs()) {
	require('./localServices'); // Broker is set here
	require('./watchDb');
} else {
	await registerEEBroker();
}
