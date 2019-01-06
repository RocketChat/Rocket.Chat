import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';

Meteor.startup(function() {
	return RocketChat.TabBar.addButton({
		groups: ['channel', 'group', 'direct'],
		id: 'threads',
		i18nTitle: 'Threads',
		icon: 'thread',
		template: 'threadsTabbar',
		order: 10,
	});
});
