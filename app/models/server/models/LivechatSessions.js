import { Base } from './_Base';

/**
 * Livechat session model
 */

export class LivechatSessions extends Base {
	constructor() {
		super('livechat_sessions');
	}

	findOneVisitorAndUpdateSession(visitorInfo) {
		const query = {
			token: visitorInfo.token,
		};

		delete visitorInfo.token;
		const update = {
			$set: {
				visitorInfo,
				state: 'registered',
			},
		};

		return this.update(query, update);
	}

	findOneVisitorByTokenAndUpdateState(token, state) {
		const query = {
			token,
		};
		let update;
		const sessionInfo = this.findOne(query);
		if (state === 'chatting') {
			const { chatStart } = sessionInfo;
			if (!chatStart) {
				update = {
					$set: {
						state,
						chatStartTime: new Date(),
						chatStart: true,
					},
					$unset: {
						offlineTime: '',
					},
				};
			} else {
				update = {
					$set: {
						state,
					},
					$unset: {
						offlineTime: '',
					},
				};
			}
		} else if (state === 'offline') {
			update = {
				$set: {
					state,
					offlineTime: new Date(),
					chatStart: false,
				},
			};
		} else {
			update = {
				$set: {
					state,
				},
			};
		}

		return this.update(query, update);
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
		const { token, location, deviceInfo } = data;

		return this.insert({
			token,
			location,
			deviceInfo,
			createdAt: new Date(),
			count: 1,
			state: 'idle',
		});
	}
}

export default new LivechatSessions();
