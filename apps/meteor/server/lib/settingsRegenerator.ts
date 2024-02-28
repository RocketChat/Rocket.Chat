// Validates settings on DB are correct on structure
// And deletes invalid ones
import { Logger } from '@rocket.chat/logger';
import { Settings } from '@rocket.chat/models';

// Validates settings on DB are correct on structure by matching the ones missing all the required fields
const logger = new Logger('SettingsRegenerator');
export async function settingsRegenerator() {
	const invalidSettings = await Settings.find(
		{
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
		},
		{ projection: { _id: 1 } },
	).toArray();

	if (invalidSettings.length > 0) {
		logger.warn({
			msg: 'Invalid settings found on DB. Deleting them.',
			settings: invalidSettings.map(({ _id }) => _id),
		});
		await Settings.deleteMany({ _id: { $in: invalidSettings.map(({ _id }) => _id) } });
	} else {
		logger.info('No invalid settings found on DB.');
	}
}
