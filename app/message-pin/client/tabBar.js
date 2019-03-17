import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { settings } from '../../settings';
import { TabBar } from '../../ui-utils';

Meteor.startup(function() {
	return Tracker.autorun(function() {
		if (settings.get('Message_AllowPinning')) {
			TabBar.addButton({
				groups: ['channel', 'group', 'direct', 'groupchat'],
				id: 'pinned-messages',
				i18nTitle: 'Pinned_Messages',
				icon: 'pin',
				template: 'pinnedMessages',
				order: 10,
			});
		} else {
			TabBar.removeButton('pinned-messages');
		}
	});
});
