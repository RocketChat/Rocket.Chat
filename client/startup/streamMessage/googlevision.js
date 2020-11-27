import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { settings } from '../../../app/settings';
import { callbacks } from '../../../app/callbacks';

Meteor.startup(() => {
	Tracker.autorun(async () => {
		const isEnabled = settings.get('GoogleVision_Enable');

		if (!isEnabled) {
			callbacks.remove('streamMessage', 'googlevision');
			return;
		}

		const { createGoogleVisionMessageStreamHandler } = await import('../../../app/google-vision/client');

		const streamMessage = createGoogleVisionMessageStreamHandler();

		callbacks.add('streamMessage', streamMessage, callbacks.priority.HIGH - 3, 'googlevision');
	});
});
