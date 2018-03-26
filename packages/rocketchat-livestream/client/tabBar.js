Meteor.startup(function() {
	Tracker.autorun(function() {
		if (RocketChat.settings.get('Livestream_enabled')) {
			return RocketChat.TabBar.addButton({
				groups: ['channel', 'group'],
				id: 'livestream',
				i18nTitle: 'Livestream',
				icon: 'podcast',
				template: 'liveStreamTab',
				order: 1,
				class: () => {
					const roomWithStream = RocketChat.models.Rooms.findOne({_id: Session.get('openedRoom')}, { fields: { 'streamingOptions': 1 } });
					return roomWithStream && roomWithStream.streamingOptions && roomWithStream.streamingOptions.id ? 'live' : '';
				}
			});
		} else {
			RocketChat.TabBar.removeButton('livestream');
		}
	});
});
