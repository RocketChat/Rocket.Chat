import { Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 289,
	async up() {
		const deprecatedSettings = [
			'LiveStream & Broadcasting',
			'Livestream_enabled',
			'Broadcasting_enabled',
			'Broadcasting_client_id',
			'Broadcasting_client_secret',
			'Broadcasting_api_key',
			'Broadcasting_media_server_url',
		];

		await Settings.deleteMany({
			_id: { $in: deprecatedSettings },
		});
	},
});
