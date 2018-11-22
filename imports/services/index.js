// import config from './moleculer.config';
import Queue from './services/queue.js';
import Authorization from './services/authorization';
import { ServiceBroker } from 'moleculer';
import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';

const broker = new ServiceBroker({
	logLevel: 'debug',
	sampleCount: 1,
	metrics: true,
	cacher: 'Memory',
});
broker.createService(Queue);
broker.createService(Authorization);

RocketChat.Services = broker;

Meteor.startup(() => broker.start());

export default broker;
