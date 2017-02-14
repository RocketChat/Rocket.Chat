Template.channelsAnonymous.helpers({
	isActive() {
		const currentRoom = RocketChat.models.Rooms.findOne({ _id: Session.get('openedRoom') });
		if (currentRoom) {
			return 'active';
		}
	},

	rooms() {
		const query = {
			t: 'c'
		};

		return RocketChat.models.Rooms.find(query, { sort: { name: 1 } });
	}
});

Template.channelsAnonymous.events({
	'click .more-channels'() {
		SideNav.setFlex('listChannelsFlex');
		SideNav.openFlex();
	}
});
