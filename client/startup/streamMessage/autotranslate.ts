import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { settings } from '../../../app/settings/client';
import { callbacks } from '../../../app/callbacks/client';
import { hasPermission } from '../../../app/authorization/client';

Meteor.startup(() => {
	Tracker.autorun(() => {
		const isEnabled = settings.get('AutoTranslate_Enabled') && hasPermission('auto-translate');

		if (!isEnabled) {
			callbacks.remove('streamMessage', 'autotranslate-stream');
			return;
		}

		import('../../../app/autotranslate/client').then(({ createAutoTranslateMessageStreamHandler }) => {
			const streamMessage = createAutoTranslateMessageStreamHandler();
			callbacks.remove('streamMessage', 'autotranslate-stream');
			callbacks.add('streamMessage', streamMessage, callbacks.priority.HIGH - 3, 'autotranslate-stream');
		});
	});
});
