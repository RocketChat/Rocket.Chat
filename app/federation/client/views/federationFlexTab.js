import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';

import { ChatRoom } from '../../../models';

Template.federationFlexTab.helpers({
	federationPeerStatuses() {
		const room = ChatRoom.findOne(Session.get('openedRoom'));

		// Only add if the room is federated
		if (!room || !room.federation) { return []; }

		return [];
	},
});
