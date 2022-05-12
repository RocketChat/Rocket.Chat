import { MongoHelper } from './MongoHelper';

const mongoBaseUrl = process.env.MONGO_URL
	? `${process.env.MONGO_URL}?retryWrites=false`
	: 'mongodb://localhost:3001/meteor?retryWrites=false';
export const clearMessages = async (channelIds: string[]): Promise<void> => {
	await MongoHelper.connect(mongoBaseUrl);
	const messageCollection = await MongoHelper.getCollection('rocketchat_message');
	await messageCollection.deleteMany({ rid: { $in: channelIds } });
	await MongoHelper.disconnect();
};
