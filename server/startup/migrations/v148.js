import { Migrations } from '../../../app/migrations/server';
import { Users, Settings, FederationPeers } from '../../../app/models/server';

Migrations.add({
	version: 148,
	up() {
		const { value: localDomain } = Settings.findOne({ _id: 'FEDERATION_Domain' });

		Users.update({
			federation: { $exists: true }, 'federation.peer': { $ne: localDomain },
		}, {
			$set: { isRemote: true },
		}, { multi: true });

		FederationPeers.update({
			peer: { $ne: localDomain },
		}, {
			$set: { isRemote: true },
		}, { multi: true });

		FederationPeers.update({
			peer: localDomain,
		}, {
			$set: { isRemote: false },
		}, { multi: true });
	},
	down() {
		// Down migration does not apply in this case
	},
});
