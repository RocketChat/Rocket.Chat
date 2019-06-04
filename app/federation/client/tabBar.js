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

	// TabBar.addButton({
	// 	groups: ['direct', 'group'],
	// 	id: 'e2e',
	// 	i18nTitle: 'E2E',
	// 	icon: 'key',
	// 	class: () => (ChatRoom.findOne(Session.get('openedRoom')) || {}).encrypted && 'enabled',
	// 	action: () => {
	// 		const room = ChatRoom.findOne(Session.get('openedRoom'));
	// 		call('saveRoomSettings', room._id, 'encrypted', !room.encrypted);
	// 	},
	// 	order: 10,
	// 	condition: () => hasAllPermission('edit-room', Session.get('openedRoom')),
	// });
});
