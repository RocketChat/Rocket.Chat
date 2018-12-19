class FederationDNSCache extends RocketChat.models._Base {
	constructor() {
		super('federation_dns_cache');
	}

	findOneByDomain(domain) {
		return this.findOne({ domain });
	}
}

RocketChat.models.FederationDNSCache = new FederationDNSCache();
