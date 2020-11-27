import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { settings } from '../../../app/settings';
import { callbacks } from '../../../app/callbacks';
import { hasPermission } from '../../../app/authorization/client';

Meteor.startup(() => {
	Tracker.autorun(async () => {
		const isEnabled = settings.get('AutoTranslate_Enabled') && hasPermission('auto-translate');

		if (!isEnabled) {
			callbacks.remove('renderMessage', 'autotranslate');
			return;
		}

		const { createAutoTranslateMessageRenderer } = await import('../../../app/autotranslate/client');

		const renderMessage = createAutoTranslateMessageRenderer();

		callbacks.add('renderMessage', renderMessage, callbacks.priority.HIGH - 3, 'autotranslate');
	});
});
