import { Meteor } from 'meteor/meteor';
import { TabBar } from 'meteor/rocketchat:ui-utils';

Meteor.startup(function() {
	TabBar.addButton({
		groups: ['channel', 'group', 'direct', 'groupchat'],
		id: 'push-notifications',
		i18nTitle: 'Notifications_Preferences',
		icon: 'bell',
		template: 'pushNotificationsFlexTab',
		order: 100,
	});
});
