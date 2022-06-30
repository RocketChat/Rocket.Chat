import { MongoHelper } from '../utils/MongoHelper';
import { URL_MONGODB } from '../utils/constants';
import { roomFixture, user, subscription } from '../fixtures';

const insertRoom = async (): Promise<void> => {
	const roomCollection = await MongoHelper.getCollection('rocketchat_room');
	await roomCollection.insertMany(roomFixture);
};

const insertUser = async (): Promise<void> => {
	const userCollection = await MongoHelper.getCollection('users');
	await userCollection.insertOne(user);
};

const subscribeUserInChannels = async (): Promise<void> => {
	const subscribeCollections = await MongoHelper.getCollection('rocketchat_subscription');
	await subscribeCollections.insertMany(subscription);
};

export default async (): Promise<void> => {
	await MongoHelper.connect(URL_MONGODB);
	await insertRoom();
	await insertUser();
	await subscribeUserInChannels();
	await MongoHelper.disconnect();
};
