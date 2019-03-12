import { Meteor } from 'meteor/meteor';
import { TabBar } from 'meteor/rocketchat:ui-utils';

Meteor.startup(() => {
	TabBar.addButton({
		groups: ['channel', 'group'],

		id: 'channel-settings',
		anonymous: true,
		i18nTitle: 'Room_Info',
		icon: 'info-circled',
		template: 'channelSettings',
		order: 0,
	});
});
