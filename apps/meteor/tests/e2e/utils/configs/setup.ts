import { MongoHelper } from '../helpers/MongoHelper';
import { roomMock, subscriptionMock, userMock } from '../mocks/initialData';

const mongoBaseUrl = process.env.MONGO_URL
	? `${process.env.MONGO_URL}?retryWrites=false`
	: 'mongodb://localhost:3001/meteor?retryWrites=false';

const insertRoom = async (): Promise<void> => {
	const roomCollection = await MongoHelper.getCollection('rocketchat_room');
	await roomCollection.insertMany(roomMock);
};

const insertUser = async (): Promise<void> => {
	const userCollection = await MongoHelper.getCollection('users');
	await userCollection.insertOne(userMock);
};

const subscribeUserInChannels = async (): Promise<void> => {
	const subscribeCollections = await MongoHelper.getCollection('rocketchat_subscription');
	await subscribeCollections.insertMany(subscriptionMock);
};

export default async (): Promise<void> => {
	await MongoHelper.connect(mongoBaseUrl);
	await insertRoom();
	await insertUser();
	await subscribeUserInChannels();
	await MongoHelper.disconnect();
};
