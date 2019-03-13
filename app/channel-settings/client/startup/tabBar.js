import { Meteor } from 'meteor/meteor';
import { TabBar } from '/app/ui-utils';

Meteor.startup(() => {
	TabBar.addButton({
		groups: ['channel', 'group', 'direct', 'groupchat'],
		id: 'channel-settings',
		anonymous: true,
		i18nTitle: 'Room_Info',
		icon: 'info-circled',
		template: 'channelSettings',
		order: 0,
	});
});