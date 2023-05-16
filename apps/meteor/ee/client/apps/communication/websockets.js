import { Emitter } from '@rocket.chat/emitter';

import { CachedCollectionManager } from '../../../../app/ui-cached-collection/client';
import { loadButtons } from '../../../../app/ui-message/client/ActionButtonSyncer';
import { slashCommands } from '../../../../app/utils/client';
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
		Object.values(AppEvents).forEach((eventName) => {
			sdk.stream('apps', [eventName], this.emit.bind(this, eventName));
		});

		sdk.stream('apps', [AppEvents.COMMAND_ADDED], this.onCommandAddedOrUpdated);
		sdk.stream('apps', [AppEvents.COMMAND_UPDATED], this.onCommandAddedOrUpdated);
		sdk.stream('apps', [AppEvents.COMMAND_REMOVED], this.onCommandRemovedOrDisabled);
		sdk.stream('apps', [AppEvents.COMMAND_DISABLED], this.onCommandRemovedOrDisabled);
		sdk.stream('apps', [AppEvents.ACTIONS_CHANGED], this.onActionsChanged);
	}

	registerListener(event, listener) {
		this.on(event, listener);
	}

	unregisterListener(event, listener) {
		this.off(event, listener);
	}

	onCommandAddedOrUpdated = (command) => {
		const retryOnFailure = (retries) => {
			sdk.rest
				.get('/v1/commands.get', { command })
				.then((result) => {
					slashCommands.add(result.command);
				})
				.catch((error) => {
					if (retries - 1 === 0) {
						throw error;
					}

					setTimeout(() => {
						retryOnFailure(retries - 1);
					}, 3000);
				});
		};

		retryOnFailure(3);
	};

	onCommandRemovedOrDisabled = (command) => {
		delete slashCommands.commands[command];
	};

	onActionsChanged = () => loadButtons();
}
