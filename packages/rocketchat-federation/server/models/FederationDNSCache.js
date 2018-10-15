class FederationDNSCache extends RocketChat.models._Base {
	constructor() {
		super('federation_dns_cache');
	}

	getEmailDomain(email) {
		return email.split('@')[1];
	}

	findOneByEmail(email) {
		const domain = this.getEmailDomain(email);

		const peer = this.findOne({ domains: [domain] });

		return peer;
	}

	findOneByIdentifier(identifier) {
		const peer = this.findOne({ identifier });

		return peer;
	}
}

RocketChat.models.FederationDNSCache = new FederationDNSCache();
