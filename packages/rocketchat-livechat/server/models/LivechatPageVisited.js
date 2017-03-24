/**
 * Livechat Page Visited model
 */
class LivechatPageVisited extends RocketChat.models._Base {
	constructor() {
		super('livechat_page_visited');

		this.tryEnsureIndex({ 'token': 1 });
		this.tryEnsureIndex({ 'ts': 1 });

		// keep history for 1 month if the visitor does not register
		this.tryEnsureIndex({ 'expireAt': 1 }, { sparse: 1, expireAfterSeconds: 0 });
	}

	saveByToken(token, pageInfo) {
		// keep history of unregistered visitors for 1 month
		const keepHistoryMiliseconds = 2592000000;

		return this.insert({
			token,
			page: pageInfo,
			ts: new Date(),
			expireAt: new Date().getTime() + keepHistoryMiliseconds
		});
	}

	findByToken(token) {
		return this.find({ token }, { sort : { ts: -1 }, limit: 20 });
	}

	keepHistoryForToken(token) {
		return this.update({
			token,
			expireAt: {
				$exists: true
			}
		}, {
			$unset: {
				expireAt: 1
			}
		}, {
			multi: true
		});
	}
}

RocketChat.models.LivechatPageVisited = new LivechatPageVisited();
