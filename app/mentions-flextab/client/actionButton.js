import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { MessageAction, RoomHistoryManager } from '../../ui-utils';
import { messageArgs } from '../../ui-utils/client/lib/messageArgs';

Meteor.startup(function() {
	MessageAction.addButton({
		id: 'jump-to-message',
		icon: 'jump',
		label: 'Jump_to_message',
		context: ['mentions', 'threads'],
		action() {
			const { msg: message } = messageArgs(this);
			if (window.matchMedia('(max-width: 500px)').matches) {
				Template.instance().tabBar.close();
			}
			RoomHistoryManager.getSurroundingMessages(message, 50);
		},
		order: 100,
		group: 'menu',
	});
});
