import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { Session } from 'meteor/session';
import { RocketChat } from 'meteor/rocketchat:lib';

Meteor.startup(function() {
	Tracker.autorun(function() {
		RocketChat.TabBar.removeButton('livestream');
		if (RocketChat.settings.get('Livestream_enabled')) {
			const live = RocketChat.models.Rooms.findOne({ _id: Session.get('openedRoom'), 'streamingOptions.type': 'livestream', 'streamingOptions.id': { $exists :1 } }, { fields: { streamingOptions: 1 } });
			RocketChat.TabBar.size = live ? 5 : 4;
			return RocketChat.TabBar.addButton({
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
