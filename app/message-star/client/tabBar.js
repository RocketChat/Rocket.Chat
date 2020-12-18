import { Meteor } from 'meteor/meteor';

import { TabBar } from '../../ui-utils';

Meteor.startup(function() {
	TabBar.addButton({
		groups: ['channel', 'group', 'direct'],
		id: 'starred-messages',
		i18nTitle: 'Starred_Messages',
		icon: 'star',
		template: 'StarredMessages',
		full: true,
		order: 10,
	});
});
