import { MongoHelper } from '../utils/MongoHelper';
import { URL_MONGODB, DATABASE_NAME } from '../utils/constants';

export default async (): Promise<void> => {
	await MongoHelper.connect(URL_MONGODB);
	await MongoHelper.dropDatabase(DATABASE_NAME);
	await MongoHelper.disconnect();
};
