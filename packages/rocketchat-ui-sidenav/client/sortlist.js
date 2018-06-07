/* globals popover */

const checked = function(prop, field) {
	const user = Meteor.user();
	if (prop === 'sidebarShowFavorites') {
		return RocketChat.getUserPreference(user, 'sidebarShowFavorites');
	}
	if (prop === 'groupByType') {
		return RocketChat.getUserPreference(user, 'groupByType');
	}
	if (prop === 'sidebarShowUnread') {
		return RocketChat.getUserPreference(user, 'sidebarShowUnread');
	}
	if (prop === 'sidebarSortby') {
		return (RocketChat.getUserPreference(user, 'sidebarSortby') || 'activity') === field;
	}
};

Template.sortlist.helpers({
	favorite() {
		return RocketChat.settings.get('Favorite_Rooms');
	},
	checked,
	bold(...props) {
		return checked(...props) ? 'rc-popover__item--bold' : '';
	}
});

Template.sortlist.events({
	'change input'({currentTarget}) {
		const name = currentTarget.getAttribute('name');
		let value = currentTarget.getAttribute('type') === 'checkbox' ? currentTarget.checked : currentTarget.value;

		// TODO change mergeChannels to GroupByType
		if (name === 'mergeChannels') {
			value = !value;
		}
		Meteor.call('saveUserPreferences', {
			[name] : value
		});
		popover.close();
	}
});

Template.sortlist.onRendered(function() {

});
