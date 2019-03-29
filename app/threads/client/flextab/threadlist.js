import { Meteor } from 'meteor/meteor';

import { TabBar } from '../../../ui-utils/client';

Meteor.startup(function() {
	return TabBar.addButton({
		groups: ['channel', 'group', 'direct'],
		id: 'thread',
		i18nTitle: 'threads',
		icon: 'thread',
		template: 'threads',
		order: 10,
	});
});
