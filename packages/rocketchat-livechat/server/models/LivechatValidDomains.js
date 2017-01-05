class LivechatValidDomains extends RocketChat.models._Base {
	constructor() {
		super('livechat_valid_domains');
		this.tryEnsureIndex({ 'domain': 1 }); // in form "www.cname.website.com"
	}

	findOneById(dId) {
		check(dId, String);
		return this.findOne({ _id: dId });
	}

	findOneByDomain(domain) {
		check(domain, String);
		return this.findOne({ domain: domain });
	}

	insertDomain(domain) {
		check(domain, String);

		// check to make sure domain follows schema "www.cname.website.com" before inserting
		if (domain.match(/https?:\/\/(?:www\.|(?!www))[^\s\.]+\.[^\s]{2,}|www\.[^\s]+\.[^\s]{2,}/) !== null) {
			//parse the domain and insert
			this.insert({ domain: domain.match(/^(?:https?:\/\/)?(?:www\.)?([^\/]+)/)[1] });
		}
	}

	removeDomain(domain) {
		check(domain, String);
		this.remove({ domain: domain});
	}
}

RocketChat.models.LivechatValidDomains = new LivechatValidDomains();
