import { Migrations } from '../../../app/migrations/server';
import { Users, Settings, FederationServers } from '../../../app/models/server';

Migrations.add({
	version: 148,
	up() {
		let { value: localDomain } = Settings.findOne({ _id: 'FEDERATION_Domain' });

		localDomain = localDomain.replace('@', '');

		Users.update({
			federation: { $exists: true }, 'federation.peer': { $ne: localDomain },
		}, {
			$set: { isRemote: true },
		}, { multi: true });

		FederationServers.update({
			peer: { $ne: localDomain },
		}, {
			$set: { isRemote: true },
		}, { multi: true });

		FederationServers.update({
			peer: localDomain,
		}, {
			$set: { isRemote: false },
		}, { multi: true });
	},
	down() {
		// Down migration does not apply in this case
	},
});
