import { Meteor } from 'meteor/meteor';

import { TabBar } from '../../ui-utils';

Meteor.startup(function() {
	return TabBar.addButton({
		groups: ['channel', 'group'],
		id: 'mentions',
		i18nTitle: 'Mentions',
		icon: 'at',
		template: 'mentionsFlexTab',
		order: 3,
	});
});
