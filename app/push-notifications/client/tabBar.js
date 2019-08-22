import { Meteor } from 'meteor/meteor';

import { TabBar } from '../../ui-utils';

Meteor.startup(function() {
	TabBar.addButton({
		groups: ['channel', 'group', 'direct'],
		id: 'push-notifications',
		i18nTitle: 'Notifications_Preferences',
		icon: 'bell',
		template: 'pushNotificationsFlexTab',
		order: 100,
	});
});
