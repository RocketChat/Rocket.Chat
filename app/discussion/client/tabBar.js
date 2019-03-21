import { Meteor } from 'meteor/meteor';
import { TabBar } from '../../ui-utils';

Meteor.startup(function() {
	return TabBar.addButton({
		groups: ['channel', 'group', 'direct'],
		id: 'discussions',
		i18nTitle: 'Discussion',
		icon: 'discussion',
		template: 'discussionsTabbar',
		order: 10,
	});
});
