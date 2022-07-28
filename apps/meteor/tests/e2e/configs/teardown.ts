import { MongoHelper } from '../utils/MongoHelper';
import { URL_MONGODB } from '../utils/constants';

export default async (): Promise<void> => {
	await MongoHelper.connect(URL_MONGODB);
	await MongoHelper.dropDatabase();
	await MongoHelper.disconnect();
};
