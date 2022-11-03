import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { settings } from '../../../app/settings/client';
import { callbacks } from '../../../lib/callbacks';

Meteor.startup(() => {
	Tracker.autorun(() => {
		const isEnabled = settings.get('HexColorPreview_Enabled') === true;

		if (!isEnabled) {
			callbacks.remove('renderMessage', 'hexcolor');
			return;
		}

		import('../../../app/colors/client').then(({ createHexColorPreviewMessageRenderer }) => {
			const renderMessage = createHexColorPreviewMessageRenderer();
			callbacks.remove('renderMessage', 'hexcolor');
			callbacks.add('renderMessage', renderMessage, callbacks.priority.MEDIUM, 'hexcolor');
		});
	});
});
