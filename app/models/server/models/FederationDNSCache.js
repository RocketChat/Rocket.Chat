import { Base } from './_Base';

class FederationDNSCacheModel extends Base {
	constructor() {
		super('federation_dns_cache');
	}

	findOneByDomain(domain) {
		return this.findOne({ domain });
	}
}

export const FederationDNSCache = new FederationDNSCacheModel();
