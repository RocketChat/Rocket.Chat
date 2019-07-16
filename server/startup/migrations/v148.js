import { Migrations } from '../../../app/migrations/server';
import { Users, Settings } from '../../../app/models';

Migrations.add({
	version: 148,
	up() {
		const { value: localDomain } = Settings.findOne({ _id: 'FEDERATION_Domain' });

		Users.update({
			federation: { $exists: true }, 'federation.peer': { $ne: localDomain },
		},
		{ $set: { isRemote: true } },
		{ multi: 1 });
	},
	down() {
		// Down migration does not apply in this case
	},
});
