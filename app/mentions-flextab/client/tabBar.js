import { Meteor } from 'meteor/meteor';
import { TabBar } from '/app/ui-utils';

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
