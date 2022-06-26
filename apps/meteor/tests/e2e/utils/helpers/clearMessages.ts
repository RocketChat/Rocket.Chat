import { MongoHelper } from './MongoHelper';
import { URL_MONGODB } from '../constants';

export const clearMessages = async (channelIds: string[]): Promise<void> => {
	await MongoHelper.connect(URL_MONGODB);
	const messageCollection = await MongoHelper.getCollection('rocketchat_message');
	await messageCollection.deleteMany({ rid: { $in: channelIds } });
	await MongoHelper.disconnect();
};
