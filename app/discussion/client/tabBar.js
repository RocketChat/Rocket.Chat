import { Meteor } from 'meteor/meteor';

import { TabBar } from '../../ui-utils/client';

Meteor.startup(function() {
	return TabBar.addButton({
		groups: ['channel', 'group', 'direct'],
		id: 'discussions',
		i18nTitle: 'Discussions',
		icon: 'discussion',
		template: 'discussionsTabbar',
		order: 10,
	});
});
