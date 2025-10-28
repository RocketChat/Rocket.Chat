import { Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 314,
	name: 'Update default behavior of E2E_Allow_Unencrypted_Messages setting, to not allow un-encrypted messages by default.',
	async up() {
		// TODO: audit
		await Settings.updateOne(
			{
				_id: 'E2E_Allow_Unencrypted_Messages',
			},
			{
				$set: {
					value: false,
					packageValue: false,
				},
			},
		);
	},
});
