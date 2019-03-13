import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { messageBox, modal } from '/app/ui-utils';
import { settings } from '/app/settings';

Meteor.startup(function() {
	Tracker.autorun(() => {
		if (settings.get('Thread_from_context_menu') !== 'button') {
			return messageBox.actions.remove('Create_new', /start-thread/);
		}
		messageBox.actions.add('Create_new', 'Thread', {
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
