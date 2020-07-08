import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';

import { messageBox } from '../../ui-utils/client';
import { settings } from '../../settings/client';
import { Rooms } from '../../models';
import { ScreenSharinDialog } from './views/app/ui-screensharing/client';
import { screenSharingStreamer } from './lib/stream/screenSharingStream';

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
	action: ({ rid, messageBox }) => {
		Meteor.call('livechat:requestScreenSharing', rid);
		ScreenSharinDialog.opened ? ScreenSharinDialog.close() : ScreenSharinDialog.open(messageBox, { rid, src: 'https://cobrowse.io/dashboard' });
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
		ScreenSharinDialog.opened ? ScreenSharinDialog.close() : ScreenSharinDialog.open(messageBox, { rid, src: 'https://cobrowse.io/dashboard' });
	},
});

Meteor.startup(function() {
	Meteor.call('livechat:getActiveSessions', (err, data) => {
		sessions.set(data);
	});
	Tracker.autorun(() => {
		screenSharingStreamer.on('session-modified', ({ activeSessions }) => {
			sessions.set(activeSessions);
		});
	});
});
