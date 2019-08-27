import { Meteor } from 'meteor/meteor';

import { Base } from '../../models';

class LivechatExternalMessageClass extends Base {
	constructor() {
		super('livechat_external_message');

		if (Meteor.isClient) {
			this._initModel('livechat_external_message');
		}
	}

	// FIND
	findByRoomId(roomId, sort = { ts: -1 }) {
		const query = { rid: roomId };

		return this.find(query, { sort });
	}
}

export const LivechatExternalMessage = new LivechatExternalMessageClass();
