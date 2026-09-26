import { Permissions } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 336,
	name: 'Remove unused permissions',
	async up() {
		await Permissions.deleteMany({
			_id: {
				$in: [
					'block-ip-device-management',
					'change-livechat-room-visitor',
					'get-server-info',
					'run-migration',
					'view-agent-canned-responses',
				],
			},
		});
	},
});
