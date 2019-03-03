import { Meteor } from 'meteor/meteor';
import { TabBar } from 'meteor/rocketchat:ui-utils';

Meteor.startup(function() {
	TabBar.addButton({
		groups: ['channel', 'group', 'direct'],
		id: 'starred-messages',
		i18nTitle: 'Starred_Messages',
		icon: 'star',
		template: 'starredMessages',
		order: 3,
	});
});
