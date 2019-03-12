import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { Session } from 'meteor/session';
import { settings } from '/app/settings';
import { TabBar } from '/app/ui-utils';
import { Rooms } from '/app/models';

Meteor.startup(function() {

	Tracker.autorun(function() {
		if (!settings.get('bigbluebutton_Enabled')) {
			return TabBar.removeButton('bbb_video');
		}
		const live = Rooms.findOne({ _id: Session.get('openedRoom'), 'streamingOptions.type': 'call' }, { fields: { streamingOptions: 1 } });

		const groups = [];

		if (settings.get('bigbluebutton_enable_d')) {
			groups.push('direct');
		}
		if (settings.get('bigbluebutton_enable_p')) {
			groups.push('group');
		}
		if (settings.get('bigbluebutton_enable_c')) {
			groups.push('channel');
		}

		TabBar.addButton({
			groups,
			id: 'bbb_video',
			i18nTitle: 'BBB Video Chat',
			icon: 'video',
			iconColor: 'red',
			template: 'videoFlexTabBbb',
			width: 600,
			order: live ? -1 : 15,
			class: () => live && 'live',
		});
	});

	Tracker.autorun(function() {
		if (settings.get('Jitsi_Enabled')) {
			TabBar.addButton({
				groups: ['direct', 'group'],
				id: 'video',
				i18nTitle: 'Video Chat',
				icon: 'video',
				iconColor: 'red',
				template: 'videoFlexTab',
				width: 600,
				order: 12,
			});
		} else {
			TabBar.removeButton('video');
		}
	});

	Tracker.autorun(function() {
		if (settings.get('Jitsi_Enabled') && settings.get('Jitsi_Enable_Channels')) {
			TabBar.addGroup('video', ['channel']);
		} else {
			TabBar.removeGroup('video', ['channel']);
		}
	});

	Tracker.autorun(function() {
		if (settings.get('Jitsi_Enabled')) {
			// Load from the jitsi meet instance.
			if (typeof JitsiMeetExternalAPI === 'undefined') {
				const prefix = __meteor_runtime_config__.ROOT_URL_PATH_PREFIX || '';
				$.getScript(`${ prefix }/packages/rocketchat_videobridge/client/public/external_api.js`);
			}

			// Compare current time to call started timeout.  If its past then call is probably over.
			if (Session.get('openedRoom')) {
				const rid = Session.get('openedRoom');

				const room = Rooms.findOne({ _id: rid });
				const currentTime = new Date().getTime();
				const jitsiTimeout = new Date((room && room.jitsiTimeout) || currentTime).getTime();

				if (jitsiTimeout > currentTime) {
					TabBar.updateButton('video', { class: 'attention' });
				} else {
					TabBar.updateButton('video', { class: '' });
				}
			}
		}
	});
});
