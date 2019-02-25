import { Subscriptions } from 'meteor/rocketchat:models';

export class AppInternalBridge {
	constructor(orch) {
		this.orch = orch;
	}

	getUsernamesOfRoomById(roomId) {
		const records = Subscriptions.findByRoomIdWhenUsernameExists(roomId, {
			fields: {
				'u.username': 1,
			},
		}).fetch();

		if (!records || records.length === 0) {
			return [];
		}

		return records.map((s) => s.u.username);
	}
}
