// Validates settings on DB are correct on structure
// And deletes invalid ones
import { Settings } from '@rocket.chat/models';

import { Logger } from '../../../server/lib/logger/Logger';

// Validates settings on DB are correct on structure by matching the ones missing all the required fields
const logger = new Logger('SettingsRegenerator');
export async function settingsRegenerator() {
	const invalidSettings = await Settings.find({
		// Putting the $and explicit to ensure it's "intentional"
		$and: [
			{ value: { $exists: false } },
			{ type: { $exists: false } },
			{ public: { $exists: false } },
			{ packageValue: { $exists: false } },
			{ blocked: { $exists: false } },
			{ sorter: { $exists: false } },
			{ i18nLabel: { $exists: false } },
		],
	}).toArray();

	if (invalidSettings.length > 0) {
		logger.warn(`Found ${invalidSettings.length} invalid settings on DB. Deleting them...`);
		logger.warn(invalidSettings.map(({ _id }) => _id));
		await Settings.deleteMany({ _id: { $in: invalidSettings.map(({ _id }) => _id) } });
	}
}
