import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';
import { modal } from 'meteor/rocketchat:ui';
import { Tracker } from 'meteor/tracker';

Meteor.startup(function() {
	Tracker.autorun(() => {
		if (RocketChat.settings.get('Thread_from_context_menu') !== 'button') {
			return RocketChat.messageBox.actions.remove('Create_new', /start-thread/);
		}
		RocketChat.messageBox.actions.add('Create_new', 'Thread', {
			id: 'start-thread',
			icon: 'thread',
			condition: () => true,
			action(data) {
				modal.open({
					// title: t('Message_info'),
					content: 'CreateThread',
					data: {
						...data,
						onCreate() {
							modal.close();
						},
					},
					showConfirmButton: false,
					showCancelButton: false,
					// confirmButtonText: t('Close'),
				});
			},
		});

	});
});
