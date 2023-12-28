import { Settings } from '@rocket.chat/models';

import { settings } from '../../../app/settings/server';
import { addMigration } from '../../lib/migrations';

addMigration({
	version: 282,
	async up() {
		const omnichannelCallProvider = settings.get('Omnichannel_call_provider');
		if (omnichannelCallProvider !== 'none') {
			await Settings.updateOne(
				{ _id: 'Omnichannel_call_provider' },
				{
					$set: { value: 'default-provider' },
				},
				{ upsert: true },
			);
		}
	},
});
