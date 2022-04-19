import { MongoHelper } from '../helpers/MongoHelper';

const mongoBaseUrl = process.env.MONGO_URL
	? `${process.env.MONGO_URL}?retryWrites=false`
	: 'mongodb://172.19.0.2:27017/rocketchat?retryWrites=false';

const removeRoom = async () => {
	const roomCollection = await MongoHelper.getCollection('rocketchat_room');
	await roomCollection.deleteMany({
		_id: {
			$in: ['9kc9F8BghhCp5bc3T', 'fWJChTFjhQLXZrusq'],
		},
	});
};

const removeUser = async () => {
	const userCollection = await MongoHelper.getCollection('users');
	await userCollection.deleteOne({ _id: 'vvsKGW5tKKqP9vj54' });
};

const removeSubscription = async () => {
	const subscribeCollections = await MongoHelper.getCollection('rocketchat_subscription');
	await subscribeCollections.deleteMany({
		_id: {
			$in: ['zjHWmhH4go9NoGwTP', 'RD7gjmtqnQtnR6BTt', 'cKZP37FdE8soBpJmN'],
		},
	});
};

export default async () => {
	console.log('Removing user from test');
	await MongoHelper.connect(mongoBaseUrl);
	await removeRoom();
	await removeUser();
	await removeSubscription();
	await MongoHelper.disconnect();
};
