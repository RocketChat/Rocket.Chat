import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { settings } from '../../../app/settings';
import { callbacks } from '../../../app/callbacks';

Meteor.startup(() => {
	Tracker.autorun(async () => {
		const isEnabled = settings.get('GoogleVision_Enable');

		if (!isEnabled) {
			callbacks.remove('renderMessage', 'googlevision');
			return;
		}

		const { createGoogleVisionMessageRenderer } = await import('../../../app/google-vision/client');

		const renderMessage = createGoogleVisionMessageRenderer();

		callbacks.add('renderMessage', renderMessage, callbacks.priority.HIGH - 3, 'googlevision');
	});
});
