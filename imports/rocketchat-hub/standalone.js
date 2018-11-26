import { ServiceBroker } from 'moleculer';
const { MongoClient } = require('mongodb');
import hub from './index';
// Database Name

const broker = new ServiceBroker({
	logLevel: 'info',
	sampleCount: 1,
	metrics: true,
	cacher: 'Memory',
});
const { MONGO_URL } = process.env;

const [, url,, name] = /mongodb:\/\/.*?:[0-9]+(\/)(.*)/.exec(MONGO_URL);
// Connect using MongoClient
MongoClient.connect(url, function(err, client) {
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
