// import resetSelection from '../resetSelection';
import { Meteor } from 'meteor/meteor';

import { TabBar } from '../../../ui-utils';
import { hasAllPermission } from '../../../authorization';

Meteor.startup(() => {
	TabBar.addButton({
		groups: ['channel', 'group', 'direct'],
		id: 'export-messages',
		anonymous: true,
		i18nTitle: 'Export_Messages',
		icon: 'mail',
		template: 'ExportMessages',
		full: true,
		order: 12,
		condition: () => hasAllPermission('mail-messages'),
	});

	// RocketChat.callbacks.add('roomExit', () => resetSelection(false), RocketChat.callbacks.priority.MEDIUM, 'room-exit-mail-messages');
});
