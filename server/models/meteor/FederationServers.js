import { Base } from './_Base';
import { Users } from '../raw';

class FederationServersModel extends Base {
	constructor() {
		super('federation_servers');

		this.tryEnsureIndex({ domain: 1 });
	}

	async refreshServers() {
		const domains = await Users.getDistinctFederationDomains();

		domains.forEach((domain) => {
			this.update({ domain }, {
				$setOnInsert: {
					domain,
				},
			}, { upsert: true });
		});

		this.remove({ domain: { $nin: domains } });
	}
}

export const FederationServers = new FederationServersModel();
