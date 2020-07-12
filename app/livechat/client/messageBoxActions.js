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

const sessions = new ReactiveVar([]);

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

		return !sessions.get().includes(rid);
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

		return sessions.get().includes(rid);
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
		sessions.set(data);
	});
	Tracker.autorun(() => {
		screenSharingStreamer.on('session-modified', ({ activeSessions }) => {
			console.log(activeSessions);
			sessions.set(activeSessions);
		});
	});
});

// callbacks.add('enter-room', (sub) => {
// 	console.log(sub);
// 	console.log(sessions.get());

// 	// if (sessions.get().length === 0) {
// 	// 	return;
// 	// }
// 	if (ScreenSharinDialog.opened) {
// 		ScreenSharinDialog.close();
// 	}
// 	if (!sessions.get().includes(sub.rid)) {
// 		return;
// 	}
// 	console.log('entered');
// 	ScreenSharinDialog.open(null, { rid: sub.rid, src: `https://ashwaniydv.github.io/sstest/index.html?rid=${ sub.rid }` });
// });

callbacks.add('roomExit', () => {
	if (ScreenSharinDialog.opened) {
		ScreenSharinDialog.close();
	}
});
