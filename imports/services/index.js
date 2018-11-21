import config from './moleculer.config';
import Queue from './services/queue.js';
import { ServiceBroker } from 'moleculer';

const broker = new ServiceBroker({
	logLevel: 'debug',
	sampleCount: 1,
	metrics: true,
	cacher: 'Memory',
});
broker.createService(Queue);
broker.start();
Meteor.Services = broker;
export default broker;
