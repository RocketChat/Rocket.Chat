import { Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 307,
	name: 'Update default behavior of E2EE settings, to not allow un-encrypted messages by default and allow files encryption by default.',
	async up() {
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
		await Settings.updateOne(
			{
				_id: 'E2E_Enable_Encrypt_Files',
			},
			{
				$set: {
					value: true,
					packageValue: true,
				},
			},
		);
	},
});
