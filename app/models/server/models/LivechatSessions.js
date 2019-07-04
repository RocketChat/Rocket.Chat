import { Base } from './_Base';

/**
 * Livechat session model
 */

export class LivechatSessions extends Base {
	constructor() {
		super('livechat_sessions');
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
		});
	}
}

export default new LivechatSessions();
