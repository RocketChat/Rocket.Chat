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
			},
		};

		return this.update(query, update);
	}

	findOneVisitorByTokenAndUpdateStatus(token, status, chatStatus) {
		const query = {
			token,
		};
		let update;
		const sessionInfo = this.findOne(query);
		if (status === 'online') {
			const { chatStart } = sessionInfo;
			if (!chatStart) {
				update = {
					$set: {
						status,
						chatStatus,
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
						status,
						chatStatus,
					},
					$unset: {
						offlineTime: '',
					},
				};
			}
		} else if (status === 'offline') {
			update = {
				$set: {
					status,
					chatStatus,
					offlineTime: new Date(),
					chatStart: false,
				},
			};
		} else {
			update = {
				$set: {
					status,
					chatStatus,
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
		});
	}

	updateChatStatusOnRoomCloseOrDeleteByToken(token, status) {
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
}

export default new LivechatSessions();
