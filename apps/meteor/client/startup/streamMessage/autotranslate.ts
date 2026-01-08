import { clientCallbacks } from '@rocket.chat/ui-client';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import { hasPermission } from '../../../app/authorization/client';
import { settings } from '../../lib/settings';

Meteor.startup(() => {
	Tracker.autorun(() => {
		const isEnabled = settings.watch('AutoTranslate_Enabled') && hasPermission('auto-translate');

		if (!isEnabled) {
			clientCallbacks?.remove('streamMessage', 'autotranslate-stream');
			return;
		}

		import('../../../app/autotranslate/client').then(({ createAutoTranslateMessageStreamHandler }) => {
			const streamMessage = createAutoTranslateMessageStreamHandler();
			if (!clientCallbacks) {
				return;
			}

			const priority = clientCallbacks.priority?.HIGH ?? 0;
			clientCallbacks.remove('streamMessage', 'autotranslate-stream');
			clientCallbacks.add('streamMessage', streamMessage, priority - 3, 'autotranslate-stream');
		});
	});
});
