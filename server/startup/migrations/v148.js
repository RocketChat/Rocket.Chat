import { Migrations } from '../../migrations';
import { Users, Settings, FederationServers } from '../../../app/models/server';

Migrations.add({
	version: 148,
	up() {
		const domainSetting = Settings.findOne({ _id: 'FEDERATION_Domain' });

		if (!domainSetting) {
			return;
		}

		const { value: domain } = domainSetting;

		const localDomain = domain.replace('@', '');

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
