import { clientCallbacks } from '@rocket.chat/ui-client';

import { hasPermission } from '../../../app/authorization/client';
import { PermissionsCachedStore } from '../../cachedStores';
import { settings } from '../../lib/settings';
import { Users } from '../../stores';

const STREAM_HANDLER_ID = 'autotranslate-stream';

const applyAutoTranslateStreamHandler = () => {
	const isEnabled = settings.peek('AutoTranslate_Enabled') && hasPermission('auto-translate');

	if (!isEnabled) {
		clientCallbacks.remove('streamMessage', STREAM_HANDLER_ID);
		return;
	}

	void import('../../../app/autotranslate/client').then(({ createAutoTranslateMessageStreamHandler }) => {
		const streamMessage = createAutoTranslateMessageStreamHandler();
		clientCallbacks.remove('streamMessage', STREAM_HANDLER_ID);
		clientCallbacks.add('streamMessage', streamMessage, clientCallbacks.priority.HIGH - 3, STREAM_HANDLER_ID);
	});
};

applyAutoTranslateStreamHandler();
settings.observe('AutoTranslate_Enabled', applyAutoTranslateStreamHandler);
PermissionsCachedStore.useReady.subscribe(applyAutoTranslateStreamHandler);
Users.use.subscribe(applyAutoTranslateStreamHandler);
