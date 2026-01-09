import { Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 322,
	name: 'Remove Tokenpass settings',
	async up() {
		await Settings.deleteMany({
			_id: {
				$in: [
					'Accounts_OAuth_Tokenpass',
					'API_Tokenpass_URL',
					'Accounts_OAuth_Tokenpass_id',
					'Accounts_OAuth_Tokenpass_secret',
					'Accounts_OAuth_Tokenpass_callback_url',
				],
			},
		});
	},
});
