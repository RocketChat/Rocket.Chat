import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import { popover } from '../../ui-utils';
import { getUserPreference } from '../../utils';
import { settings } from '../../settings';

const checked = function(prop, field) {
	const userId = Meteor.userId();

	if (prop === 'sidebarShowDiscussion') {
		return getUserPreference(userId, 'sidebarShowDiscussion');
	}
	if (prop === 'sidebarShowServiceAccounts') {
		return getUserPreference(userId, 'sidebarShowServiceAccounts');
	}
	if (prop === 'sidebarShowFavorites') {
		return getUserPreference(userId, 'sidebarShowFavorites');
	}
	if (prop === 'sidebarGroupByType') {
		return getUserPreference(userId, 'sidebarGroupByType');
	}
	if (prop === 'sidebarShowUnread') {
		return getUserPreference(userId, 'sidebarShowUnread');
	}
	if (prop === 'sidebarSortby') {
		return (getUserPreference(userId, 'sidebarSortby') || 'alphabetical') === field;
	}
};

Template.sortlist.helpers({
	favorite() {
		return settings.get('Favorite_Rooms');
	},
	checked,
	bold(...props) {
		return checked(...props) ? 'rc-popover__item--bold' : '';
	},
});

Template.sortlist.events({
	'change input'({ currentTarget }) {
		const name = currentTarget.getAttribute('name');
		let value = currentTarget.getAttribute('type') === 'checkbox' ? currentTarget.checked : currentTarget.value;

		// TODO change mergeChannels to GroupByType
		if (name === 'mergeChannels') {
			value = !value;
		}
		Meteor.call('saveUserPreferences', {
			[name]: value,
		});
		popover.close();
	},
});
