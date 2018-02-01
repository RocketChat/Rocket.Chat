/* globals menu*/

Template.sortlist.helpers({
	favorite() {
		return RocketChat.settings.get('Favorite_Rooms');
	},
	checked(prop, field) {
		const user = Meteor.user();
		if (prop === 'sidebarShowFavorites') {
			return RocketChat.getUserPreference(user, 'sidebarShowFavorites');
		}
		if (prop === 'mergeChannels') {
			return RocketChat.getUserPreference(user, 'mergeChannels');
		}
		if (prop === 'sidebarShowUnread') {
			return RocketChat.getUserPreference(user, 'sidebarShowUnread');
		}
		if (prop === 'sidebarSortby') {
			return (RocketChat.getUserPreference(user, 'sidebarSortby') || 'activity') === field;
		}
	}
});

Template.sortlist.events({
	'change input'({currentTarget}) {
		const name = currentTarget.getAttribute('name');
		const value = currentTarget.getAttribute('type') === 'checkbox' ? currentTarget.checked : currentTarget.value;
		Meteor.call('saveUserPreferences', {
			[name] : value
		});
	}
});

Template.sortlist.onRendered(function() {

});
