import { Meteor } from 'meteor/meteor';

import { TabBar } from '../../../app/ui-utils/client';
import { hasAllPermission } from '../../../app/authorization/client';

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
});
