import { MongoHelper } from '../helpers/MongoHelper';
import { roomMock, subscriptionMock, userMock } from '../mocks/initialData';

const mongoBaseUrl = process.env.MONGO_URL
	? `${process.env.MONGO_URL}?retryWrites=false`
	: 'mongodb://172.19.0.2:27017/rocketchat?retryWrites=false';

const insertRoom = async () => {
	const roomCollection = await MongoHelper.getCollection('rocketchat_room');
	await roomCollection.insertMany(roomMock);
};

const insertUser = async () => {
	const userCollection = await MongoHelper.getCollection('users');
	await userCollection.insertOne(userMock);
};

const subscribeUserInChannels = async () => {
	const subscribeCollections = await MongoHelper.getCollection('rocketchat_subscription');
	await subscribeCollections.insertMany(subscriptionMock);
};

export default async () => {
	await MongoHelper.connect(mongoBaseUrl);
	await insertRoom();
	await insertUser();
	await subscribeUserInChannels();
	await MongoHelper.disconnect();
};
