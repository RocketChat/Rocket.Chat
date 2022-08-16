import { Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 262,
	async up() {
		const validate = await Settings.findOneById('Livechat_validate_offline_email');

		Settings.update(
			{
				_id: 'Omnichannel_validate_emails',
			},
			{
				$set: {
					value: validate?.value || false,
				},
			},
			{
				upsert: true,
			},
		);

		return Settings.removeById('Livechat_validate_offline_email');
	},
});
