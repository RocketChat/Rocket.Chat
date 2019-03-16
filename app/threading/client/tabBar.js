import { Meteor } from 'meteor/meteor';
import { TabBar } from '../../ui-utils';

Meteor.startup(function() {
	return TabBar.addButton({
		groups: ['channel', 'group', 'direct'],
		id: 'threads',
		i18nTitle: 'Threads',
		icon: 'thread',
		template: 'threadsTabbar',
		order: 10,
	});
});
