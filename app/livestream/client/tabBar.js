import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { Session } from 'meteor/session';
import { TabBar } from '/app/ui-utils';
import { Rooms } from '/app/models';
import { settings } from '/app/settings';

Meteor.startup(function() {
	Tracker.autorun(function() {
		TabBar.removeButton('livestream');
		if (settings.get('Livestream_enabled')) {
			const live = Rooms.findOne({ _id: Session.get('openedRoom'), 'streamingOptions.type': 'livestream', 'streamingOptions.id': { $exists :1 } }, { fields: { streamingOptions: 1 } });
			TabBar.size = live ? 5 : 4;
			return TabBar.addButton({
				groups: ['channel', 'group'],
				id: 'livestream',
				i18nTitle: 'Livestream',
				icon: 'podcast',
				template: 'liveStreamTab',
				order: live ? -1 : 15,
				class: () => live && 'live',
			});
		}
	});
});
