import { Base } from './_Base';

/**
 * Livechat session model
 */

export class LivechatSessions extends Base {
	constructor() {
		super('livechat_sessions');
	}

	findOneVisitorByTokenAndUpdateCount(token) {
		const query = {
			token,
		};

		const update = {
			$inc: {
				count: 1,
			},
		};

		return this.update(query, update);
	}

	findOneVisitorLocationByToken(token) {
		const query = {
			token,
		};

		return this.findOne(query);
	}

	saveVisitorLocation(data = {}) {
		const { token, location } = data;

		return this.insert({
			token,
			location,
			ts: new Date(),
			count: 1,
		});
	}
}

export default new LivechatSessions();
