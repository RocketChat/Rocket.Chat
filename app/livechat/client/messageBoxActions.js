import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Tracker } from 'meteor/tracker';

import { messageBox } from '../../ui-utils/client';
import { settings } from '../../settings/client';
import { Rooms } from '../../models';
import { ScreenSharinDialog } from './views/app/ui-screensharing/client';
import { callbacks } from '../../callbacks/client';

const openSessionIframe = (rid, src) => {
	const messageBoxRef = document.querySelector('.rc-message-box');

	if (ScreenSharinDialog.opened) {
		ScreenSharinDialog.close();
	}

	ScreenSharinDialog.open(messageBoxRef, { rid, src });
};

messageBox.actions.add('Screen_Sharing', 'Request_Screen_Sharing', {
	id: 'request-screen-sharing',
	icon: 'video',
	condition: () => {
		if (!settings.get('Livechat_enabled') || !settings.get('Livechat_screen_sharing_enabled')) {
			return;
		}
		const rid = Session.get('openedRoom');
		const room = Rooms.findOne({ _id: rid, t: 'l' });

		if (!room || (room && room.screenSharing && room.screenSharing.active)) {
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
		if (room && room.screenSharing && room.screenSharing.active) {
			openSessionIframe(rid, room.screenSharing.sessionUrl);
		}
	});
});

callbacks.add('roomExit', () => {
	if (ScreenSharinDialog.opened) {
		ScreenSharinDialog.close();
	}
});
