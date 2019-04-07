import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { settings } from '../../../settings';
import { TabBar } from '../../../ui-utils';

Meteor.startup(function() {
	Tracker.autorun(function() {
		if (settings.get('Message_AllowSnippeting')) {
			TabBar.addButton({
				groups: ['channel', 'group', 'direct'],
				id: 'snippeted-messages',
				i18nTitle: 'snippet-message',
				icon: 'code',
				template: 'snippetedMessages',
				order: 20,
			});
		} else {
			TabBar.removeButton('snippeted-messages');
		}
	});
});
