import { Settings } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 336,
	name: 'Rename Accounts_RequireNameForSignUp to Accounts_RequireFullName',
	async up() {
		const oldSetting = await Settings.findOne({ _id: 'Accounts_RequireNameForSignUp' });
		if (oldSetting) {
			const { _id, ...rest } = oldSetting;
			await Settings.updateOne({ _id: 'Accounts_RequireFullName' }, { $set: rest }, { upsert: true });
			await Settings.deleteOne({ _id: 'Accounts_RequireNameForSignUp' });
		}
	},
});
