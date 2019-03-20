import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { messageBox, modal } from '../../ui-utils';
import { t } from '../../utils';
import { settings } from '../../settings';

Meteor.startup(function() {
	Tracker.autorun(() => {
		if (!settings.get('Thread_enabled')) {
			return messageBox.actions.remove('Create_new', /start-thread/);
		}
		messageBox.actions.add('Create_new', 'Thread', {
			id: 'start-thread',
			icon: 'thread',
			condition: () => true,
			action(data) {
				modal.open({
					title: t('Threading_title'),
					modifier: 'modal',
					content: 'CreateThread',
					data: {
						...data,
						onCreate() {
							modal.close();
						},
					},
					showConfirmButton: false,
					showCancelButton: false,
					confirmOnEnter: false,
				});
			},
		});

	});
});
