import { isRunningMs } from '../lib/isRunningMs';
import { registerEEBroker } from '../../ee/server';

if (!isRunningMs()) {
	require('./localServices'); // Broker is set here
	require('./watchDb');
} else {
	await registerEEBroker();
}
