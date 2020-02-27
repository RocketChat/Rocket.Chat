import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import { TabBar } from '../../../ui-utils';
import { hasAllPermission } from '../../../authorization';

Meteor.startup(() => {
	TabBar.addButton({
		groups: ['channel', 'group', 'direct'],
		id: 'clean-history',
		anonymous: true,
		i18nTitle: 'Prune_Messages',
		icon: 'eraser',
		template: 'cleanHistory',
		order: 250,
		condition: () => hasAllPermission('clean-channel-history', Session.get('openedRoom')),
	});
	TabBar.addButton({
		groups: ['group'],
		id: 'clean-history',
		anonymous: true,
		i18nTitle: 'Prune_Messages',
		icon: 'eraser',
		template: 'cleanHistory',
		order: 250,
		condition: () => hasAllPermission('clean-group-history', Session.get('openedRoom')),
	});
	TabBar.addButton({
		groups: ['direct'],
		id: 'clean-history',
		anonymous: true,
		i18nTitle: 'Prune_Messages',
		icon: 'eraser',
		template: 'cleanHistory',
		order: 250,
		condition: () => hasAllPermission('clean-direct-history', Session.get('openedRoom')),
	});
});
