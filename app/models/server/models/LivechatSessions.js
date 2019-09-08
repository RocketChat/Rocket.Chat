import { Base } from './_Base';

/**
 * Livechat session model
 */

export class LivechatSessions extends Base {
	constructor() {
		super('livechat_sessions');

		this.tryEnsureIndex({ token: 1 }, { unique: true });
	}

	updateStatusByToken(query, update) {
		return this.update(query, update);
	}

	updateSessionCount(token) {
		const query = {
			token,
		};

		const update = {
			$inc: {
				count: 1,
			},
		};

		this.update(query, update);

		return this.findOne(query);
	}

	findOneByToken(token) {
		const query = {
			token,
		};

		return this.findOne(query);
	}

	updateChatStatusByToken(token, status) {
		const query = {
			token,
		};

		const update = {
			$set: {
				chatStatus: status,
			},
		};

		return this.update(query, update);
	}

	updateSentimentByToken(token, sentimentScore) {
		const query = {
			token,
		};

		const update = {
			$set: {
				sentimentScore,
			},
		};

		return this.update(query, update);
	}
}

export default new LivechatSessions();
