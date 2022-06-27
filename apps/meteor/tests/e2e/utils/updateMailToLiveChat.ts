import { faker } from '@faker-js/faker';

import { MongoHelper } from './MongoHelper';

const mongoBaseUrl = process.env.MONGO_URL
	? `${process.env.MONGO_URL}?retryWrites=false`
	: 'mongodb://localhost:3001/meteor?retryWrites=false';

export const updateMailToLiveChat = async (): Promise<void> => {
	await MongoHelper.connect(mongoBaseUrl);
	const settingsCollection = await MongoHelper.getCollection('rocketchat_settings');
	await settingsCollection.updateOne(
		{ _id: 'Livechat_offline_email' },
		{
			$set: {
				value: faker.internet.email().toLowerCase(),
				_updatedAt: new Date(),
			},
		},
	);
};
