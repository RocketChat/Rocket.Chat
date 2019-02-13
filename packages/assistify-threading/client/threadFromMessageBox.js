import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Tracker } from 'meteor/tracker';

Meteor.startup(function() {
	Tracker.autorun(() => {
		if (RocketChat.settings.get('Thread_from_context_menu') !== 'button') {
			return RocketChat.messageBox.actions.remove('Create_new');
		}
		RocketChat.messageBox.actions.add('Create_new', 'Thread', {
			id: 'start-thread',
			icon: 'thread',
			condition: () => true,
			action() {
				return FlowRouter.go('create-thread');
			},
		});

	});
});
