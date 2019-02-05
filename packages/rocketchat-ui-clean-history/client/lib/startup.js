import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { TabBar } from 'meteor/rocketchat:ui-utils';
import { hasAllPermission } from 'meteor/rocketchat:authorization';

Meteor.startup(() => {
	TabBar.addButton({
		groups: ['channel', 'group', 'direct'],
		id: 'clean-history',
		anonymous: true,
		i18nTitle: 'Prune_Messages',
		icon: 'trash',
		template: 'cleanHistory',
		order: 250,
		condition: () => hasAllPermission('clean-channel-history', Session.get('openedRoom')),
	});
});
