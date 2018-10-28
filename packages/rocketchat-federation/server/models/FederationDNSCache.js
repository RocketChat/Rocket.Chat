class FederationDNSCache extends RocketChat.models._Base {
	constructor() {
		super('federation_dns_cache');
	}

	findOneByIdentifierOrDomain(search) {
		const searchObject = {
			$or: [{
				identifier: search,
			}, {
				domains: search,
			}],
		};

		const peer = this.findOne(searchObject);

		return peer;
	}
}

RocketChat.models.FederationDNSCache = new FederationDNSCache();
