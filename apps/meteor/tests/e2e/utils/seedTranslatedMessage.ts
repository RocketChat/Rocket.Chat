import { MongoClient } from 'mongodb';

import { URL_MONGODB } from '../config/constants';
import type { IUserState } from '../fixtures/userStates';

type SeedTranslatedMessageParams = {
	rid: string;
	msg: string;
	author: IUserState;
	translations: Record<string, string>;
};

// No translation provider is reachable from CI, so translations are seeded straight into the message.
// The author is reassigned as well because auto-translate skips messages sent by the user reading them.
export const seedTranslatedMessage = async ({ rid, msg, author, translations }: SeedTranslatedMessageParams): Promise<void> => {
	const connection = await MongoClient.connect(URL_MONGODB);

	try {
		await connection
			.db()
			.collection('rocketchat_message')
			.updateOne({ rid, msg }, { $set: { u: { _id: author.data._id, username: author.data.username }, translations } });
	} finally {
		await connection.close();
	}
};
