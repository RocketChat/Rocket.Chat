Template.home.helpers({
	title() {
		return RocketChat.settings.get('Layout_Home_Title');
	},
	body() {
		return RocketChat.settings.get('Layout_Home_Body');
	}
});

Template.home.onRendered(function() {
	if (window.matchMedia('(max-width: 780px)').matches) { // on mobile devices, show room list directly
		Meteor.defer(function() {
			window.menu.open();
		});
	}
});
