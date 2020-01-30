// import resetSelection from '../resetSelection';
import { Meteor } from 'meteor/meteor';

import { TabBar } from '../../../ui-utils';
import { hasAllPermission } from '../../../authorization';

Meteor.startup(() => {
	TabBar.addButton({
		groups: ['channel', 'group', 'direct'],
		id: 'mail-messages',
		anonymous: true,
		i18nTitle: 'Mail_Messages',
		icon: 'mail',
		template: 'mailMessagesInstructions',
		order: 10,
		condition: () => hasAllPermission('mail-messages'),
	});

	// RocketChat.callbacks.add('roomExit', () => resetSelection(false), RocketChat.callbacks.priority.MEDIUM, 'room-exit-mail-messages');
});
