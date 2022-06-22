import { MongoHelper } from '../helpers/MongoHelper';

const mongoBaseUrl = process.env.MONGO_URL
	? `${process.env.MONGO_URL}?retryWrites=false`
	: 'mongodb://localhost:3001/meteor?retryWrites=false';

const deleteRoom = async (): Promise<void> => {
	const roomCollection = await MongoHelper.getCollection('rocketchat_room');
	await roomCollection.deleteMany({ _id: { $in: ['9kc9F8BghhCp5bc3T', 'fWJChTFjhQLXZrusq'] } });
};

const deleteUser = async (): Promise<void> => {
	const userCollection = await MongoHelper.getCollection('users');
	await userCollection.deleteOne({ _id: 'vvsKGW5tKKqP9vj54' });
};

const deleteSubscribeUserInChannels = async (): Promise<void> => {
	const subscribeCollections = await MongoHelper.getCollection('rocketchat_subscription');
	await subscribeCollections.deleteMany({
		_id: { $in: ['zjHWmhH4go9NoGwTP', 'cKZP37FdE8soBpJmN', 'RD7gjmtqnQtnR6BTt', 'T3Skt3gxZoTrWwWZx', 'TjtKQyfaGtrn6PjSk'] },
	});
};

export default async (): Promise<void> => {
	await MongoHelper.connect(mongoBaseUrl);
	await deleteRoom();
	await deleteUser();
	await deleteSubscribeUserInChannels();
	await MongoHelper.disconnect();
};
