import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { settings } from '../../../app/settings';
import { callbacks } from '../../../app/callbacks';
import { hasPermission } from '../../../app/authorization';

Meteor.startup(() => {
	Tracker.autorun(async () => {
		const isEnabled = settings.get('AutoTranslate_Enabled') && hasPermission('auto-translate');

		if (!isEnabled) {
			callbacks.remove('streamMessage', 'autotranslate-stream');
			return;
		}

		const { createAutoTranslateMessageStreamHandler } = await import('../../../app/autotranslate/client');

		const streamMessage = createAutoTranslateMessageStreamHandler();

		callbacks.add('streamMessage', streamMessage, callbacks.priority.HIGH - 3, 'autotranslate-stream');
	});
});
