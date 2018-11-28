import { ServiceBroker } from 'moleculer';
// import prometheus from './prometheus';
const { MongoClient } = require('mongodb');
import hub from './index';
// Database Name

import config from './config';
const broker = new ServiceBroker(config);
const { MONGO_URL } = process.env;

const [, url, , name] = /(mongodb:\/\/.*?:[0-9]+)(\/)(.*)/.exec(MONGO_URL || 'mongodb://localhost:3001/meteor');

// Connect using MongoClient
MongoClient.connect(url, { useNewUrlParser: true }, function(err, client) {
	if (err) {
		return console.error(err);
	}
	const db = client.db(name);
	const PromService = require('moleculer-prometheus');
	const hub_service = hub({
		Trash: db.collection('rocketchat_trash'),
		Users: db.collection('users'),
		Messages: db.collection('rocketchat_message'),
		Subscriptions: db.collection('rocketchat_subscription'),
		Rooms: db.collection('rocketchat_room'),
		Settings: db.collection('rocketchat_settings'),
	});
	hub_service.mixins = [PromService];

	hub_service.settings = {
		port: 9100,
		collectDefaultMetrics: true,
		timeout: 5 * 1000,
	};

	broker.createService(hub_service);
	broker.start();
});
export default broker;
