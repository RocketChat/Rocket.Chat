import { Users } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';

addMigration({
	version: 352,
	name: "Migrate deprecated IUser 'phone' field into 'phones'",
	async up() {
		await Users.col.updateMany({ phone: { $nin: ['', null] } }, [{ $set: { phones: [{ number: '$phone' }] } }, { $unset: 'phone' }]);
		await Users.col.updateMany({ phone: { $exists: true } }, { $unset: { phone: 1 } });
	},
});
