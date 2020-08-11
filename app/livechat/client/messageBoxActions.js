import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Tracker } from 'meteor/tracker';

import { messageBox } from '../../ui-utils/client';
import { settings } from '../../settings/client';
import { Rooms } from '../../models';
import { ScreenSharingDialog } from './views/app/screen-sharing-ui/client';
import { callbacks } from '../../callbacks/client';

messageBox.actions.add('Screen_Sharing', 'Request_Screen_Sharing', {
	id: 'request-screen-sharing',
	icon: 'video',
	condition: () => {
		if (!settings.get('Livechat_enabled') || !settings.get('Livechat_screen_sharing_enabled')) {
			return;
		}
		const rid = Session.get('openedRoom');
		const room = Rooms.findOne({ _id: rid, t: 'l' });
		if (!room) {
			return;
		}
		const { screenSharing: { status } = {} } = room;
		if (status === 'active' || status === 'requested') {
			return false;
		}
		return true;
	},
	action: ({ rid }) => {
		Meteor.call('livechat:requestScreenSharing', rid);
	},
});

Meteor.startup(function() {
	Tracker.autorun(function() {
		const rid = Session.get('openedRoom');
		const room = Rooms.findOne({ _id: rid, t: 'l' });
		if (!room) {
			return;
		}
		const { screenSharing: { status, sessionUrl } = {} } = room;
		if (status !== 'active') {
			return;
		}
		const messageBoxRef = document.querySelector('.rc-message-box');
		ScreenSharingDialog.open(messageBoxRef, { rid, src: sessionUrl });
	});
});

callbacks.add('roomExit', () => {
	ScreenSharingDialog.close();
});
