import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { settings } from '../../../app/settings';
import { callbacks } from '../../../app/callbacks';

Meteor.startup(() => {
	Tracker.autorun(() => {
		const isEnabled = settings.get('GoogleVision_Enable');

		if (!isEnabled) {
			callbacks.remove('streamMessage', 'googlevision');
			return;
		}

		import('../../../app/google-vision/client').then(({ createGoogleVisionMessageStreamHandler }) => {
			const streamMessage = createGoogleVisionMessageStreamHandler();
			callbacks.remove('streamMessage', 'googlevision');
			callbacks.add('streamMessage', streamMessage, callbacks.priority.HIGH - 3, 'googlevision');
		});
	});
});
