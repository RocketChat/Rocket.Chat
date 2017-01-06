class LivechatValidDomains extends RocketChat.models._Base {
	constructor() {
		super('livechat_valid_domains');
		this.tryEnsureIndex({ 'domain': 1 }); // in form "www.cname.website.com"
	}

	findOneById(dId) {
		// check(dId, String);
		return this.findOne({ _id: dId });
	}

	findOneByDomain(domain) {
		check(domain, String);
		return this.findOne({ domain: domain });
	}

	insertDomain(domain) {
		check(domain, String);
		return this.insert({ domain: domain });
	}

	removeByDomain(domain) {
		check(domain, String);
		return this.remove({ domain: domain});
	}

	removeById(id) {
		// check(id, String);
		return this.remove({ _id: id });
	}
}

RocketChat.models.LivechatValidDomains = new LivechatValidDomains();
