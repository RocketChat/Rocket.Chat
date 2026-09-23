import { Users } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 349,
	name: "Migrate deprecated IUser 'phone' field into 'phones'",
	async up() {
		await Users.col.updateMany({ phone: { $exists: true, $ne: '' } }, [{ $set: { phones: [{ number: '$phone' }] } }, { $unset: 'phone' }]);
	},
});
