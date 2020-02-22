import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { ChatRoom } from '../../../models';
import { TabBar } from '../../../ui-utils';
import { isMobile } from '../../../utils';

Meteor.startup(() => {
	TabBar.addButton({
		groups: ['channel', 'group'],
		id: 'channel-settings',
		anonymous: true,
		i18nTitle: 'Room_Info',
		icon: 'info-circled',
		template: 'channelSettings',
		order: 1,
	});
	TabBar.addButton({
		groups: ['channel', 'group'],
		id: 'back-to-room',
		anonymous: true,
		i18nTitle: 'Back_to_room',
		icon: 'back',
		action() {
			const rid = Session.get('openedRoom');
			const { prid } = ChatRoom.findOne(rid);
			FlowRouter.goToRoomById(prid);
		},
		order: 0,
		condition() {
			const rid = Session.get('openedRoom');
			const room = ChatRoom.findOne(rid);
			return isMobile() && room && room.prid;
		},
	});
});
