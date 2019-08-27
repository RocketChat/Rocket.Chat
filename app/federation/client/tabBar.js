import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Tracker } from 'meteor/tracker';

import { ChatRoom } from '../../models';
import { TabBar } from '../../ui-utils';
import { settings } from '../../settings';

Meteor.startup(() => {
	Tracker.autorun(function() {
		if (settings.get('FEDERATION_Enabled')) {
			const room = ChatRoom.findOne(Session.get('openedRoom'));

			// Only add if the room is federated
			if (!room || !room.federation) { return; }

			return TabBar.addButton({
				groups: ['channel', 'group', 'direct'],
				id: 'federation',
				i18nTitle: 'FEDERATION_Room_Status',
				icon: 'discover',
				template: 'federationFlexTab',
				order: 0,
			});
		}

		TabBar.removeButton('federation');
	});
});
