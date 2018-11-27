import { ServiceBroker } from 'moleculer';
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
	broker.createService(hub({
		Trash: db.collection('rocketchat_trash'),
		Messages: db.collection('rocketchat_message'),
		Subscriptions: db.collection('rocketchat_subscription'),
		Rooms: db.collection('rocketchat_room'),
		Settings: db.collection('rocketchat_settings') }));
	broker.start();
});
export default broker;
