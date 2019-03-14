import { Meteor } from 'meteor/meteor';
import { TabBar } from 'meteor/rocketchat:ui-utils';
import { Session } from 'meteor/session';
import { hasAllPermission } from 'meteor/rocketchat:authorization';
import { call } from 'meteor/rocketchat:ui-utils';
import { ChatRoom } from 'meteor/rocketchat:models';

Meteor.startup(() => {
	TabBar.addButton({
		groups: ['direct', 'group'],
		id: 'e2e',
		i18nTitle: 'E2E',
		icon: 'key',
		class: () => (ChatRoom.findOne(Session.get('openedRoom')) || {}).encrypted && 'enabled',
		action:() => {
			const room = ChatRoom.findOne(Session.get('openedRoom'));
			call('saveRoomSettings', room._id, 'encrypted', !room.encrypted);
		},
		order: 10,
		condition: () => hasAllPermission('edit-room', Session.get('openedRoom')),
	});
});
