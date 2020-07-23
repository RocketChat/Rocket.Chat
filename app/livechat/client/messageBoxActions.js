import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';

import { messageBox } from '../../ui-utils/client';
import { settings } from '../../settings/client';
import { Rooms } from '../../models';
import { ScreenSharinDialog } from './views/app/ui-screensharing/client';
import { screenSharingStreamer } from './lib/stream/screenSharingStream';
import { callbacks } from '../../callbacks/client';

const activeSessions = new ReactiveVar([]);
const pendingSessions = new ReactiveVar([]);

// utility function to open screen sharing IFrame
const openSessionIframe = (rid) => {
	const messageBoxRef = document.querySelector('.rc-message-box');

	if (ScreenSharinDialog.opened) {
		ScreenSharinDialog.close();
	}

	if (!activeSessions.get().includes(rid)) {
		return;
	}

	Meteor.call('livechat:getSessionUrl', rid, (err, url) => {
		ScreenSharinDialog.open(messageBoxRef, { rid, src: url });
	});
};

messageBox.actions.add('Screen_Sharing', 'Request_Screen_Sharing', {
	id: 'request-screen-sharing',
	icon: 'video',
	condition: () => {
		const rid = Session.get('openedRoom');
		const room = Rooms.findOne({ _id: rid, t: 'l' });

		if (!room) {
			return;
		}

		if (!settings.get('Livechat_enabled') || !settings.get('Livechat_screen_sharing_enabled')) {
			return;
		}

		return !activeSessions.get().includes(rid) && !pendingSessions.get().includes(rid);
	},
	action: ({ rid }) => {
		Meteor.call('livechat:requestScreenSharing', rid);
	},
});

messageBox.actions.add('Screen_Sharing', 'Active_Screen_Sharing_Session', {
	id: 'active-screen-sharing-session',
	icon: 'video',
	condition: () => {
		const rid = Session.get('openedRoom');
		const room = Rooms.findOne({ _id: rid, t: 'l' });

		if (!room) {
			return;
		}

		if (!settings.get('Livechat_enabled') || !settings.get('Livechat_screen_sharing_enabled')) {
			return;
		}

		return activeSessions.get().includes(rid);
	},
	action: ({ rid, messageBox }) => {
		Meteor.call('livechat:getSessionUrl', rid, (err, url) => {
			if (ScreenSharinDialog.opened) {
				ScreenSharinDialog.close();
			}
			ScreenSharinDialog.open(messageBox, { rid, src: url });
		});
	},
});

Meteor.startup(function() {
	Meteor.call('livechat:getActiveSessions', (err, data) => {
		activeSessions.set(data);
	});
	Tracker.autorun(() => {
		screenSharingStreamer.on('active-sessions-modified', ({ sessions, sessionAdded }) => {
			console.log(sessions);
			activeSessions.set(sessions);
			if (sessionAdded && Session.get('openedRoom') === sessionAdded) {
				openSessionIframe(sessionAdded);
			}
		});
	});
	Tracker.autorun(() => {
		screenSharingStreamer.on('pending-sessions-modified', ({ sessions }) => {
			console.log(sessions);
			pendingSessions.set(sessions);
		});
	});
});

callbacks.add('enter-room', (sub) => {
	openSessionIframe(sub.rid);
});

callbacks.add('roomExit', () => {
	if (ScreenSharinDialog.opened) {
		ScreenSharinDialog.close();
	}
});
