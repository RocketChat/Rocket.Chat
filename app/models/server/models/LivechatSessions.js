import { Base } from './_Base';

/**
 * Livechat session model
 */

export class LivechatSessions extends Base {
	constructor() {
		super('livechat_sessions');
	}

	getUserLocationByToken(token) {
		const query = {
			token,
		};

		return this.findOne(query);
	}

	saveLocationForUser(locationData) {
		const { token, location } = locationData;

		return this.insert({
			token,
			location,
			ts: new Date(),
		});
	}
}

export default new LivechatSessions();
