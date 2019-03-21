import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { messageBox, modal } from '../../ui-utils';
import { t } from '../../utils';
import { settings } from '../../settings';

Meteor.startup(function() {
	Tracker.autorun(() => {
		if (!settings.get('Discussion_enabled')) {
			return messageBox.actions.remove('Create_new', /start-discussion/);
		}
		messageBox.actions.add('Create_new', 'Discussion', {
			id: 'start-discussion',
			icon: 'discussion',
			condition: () => true,
			action(data) {
				modal.open({
					title: t('Discussioning_title'),
					modifier: 'modal',
					content: 'CreateDiscussion',
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
