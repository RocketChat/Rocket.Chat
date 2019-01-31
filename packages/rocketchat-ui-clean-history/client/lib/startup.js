import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { RocketChat } from 'meteor/rocketchat:lib';

Meteor.startup(() => {
	RocketChat.TabBar.addButton({
		groups: ['channel', 'group', 'direct'],
		id: 'clean-history',
		anonymous: true,
		i18nTitle: 'Prune_Messages',
		icon: 'eraser',
		template: 'cleanHistory',
		order: 250,
		condition: () => RocketChat.authz.hasAllPermission('clean-channel-history', Session.get('openedRoom')),
	});
});
