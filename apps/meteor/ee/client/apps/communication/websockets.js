import { Emitter } from '@rocket.chat/emitter';

import { CachedCollectionManager } from '../../../../app/ui-cached-collection/client';
import { sdk } from '../../../../app/utils/client/lib/SDKClient';

export const AppEvents = Object.freeze({
	APP_ADDED: 'app/added',
	APP_REMOVED: 'app/removed',
	APP_UPDATED: 'app/updated',
	APP_STATUS_CHANGE: 'app/statusUpdate',
	APP_SETTING_UPDATED: 'app/settingUpdated',
	COMMAND_ADDED: 'command/added',
	COMMAND_DISABLED: 'command/disabled',
	COMMAND_UPDATED: 'command/updated',
	COMMAND_REMOVED: 'command/removed',
	ACTIONS_CHANGED: 'actions/changed',
});

export class AppWebsocketReceiver extends Emitter {
	constructor() {
		super();

		CachedCollectionManager.onLogin(() => {
			this.listenStreamerEvents();
		});
	}

	listenStreamerEvents() {
		sdk.stream('apps', ['apps'], ([key, args]) => {
			this.emit(key, ...args);
		});
	}

	registerListener(event, listener) {
		this.on(event, listener);
	}

	unregisterListener(event, listener) {
		this.off(event, listener);
	}
}
