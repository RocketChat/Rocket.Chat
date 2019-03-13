import { Meteor } from 'meteor/meteor';
import { TabBar } from '/app/ui-utils';

Meteor.startup(function() {
	TabBar.addButton({
		groups: ['channel', 'group', 'direct', 'groupchat'],
		id: 'starred-messages',
		i18nTitle: 'Starred_Messages',
		icon: 'star',
		template: 'starredMessages',
		order: 3,
	});
});
