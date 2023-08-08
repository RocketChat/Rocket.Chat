import { Emitter } from '@rocket.chat/emitter';

import { CachedCollectionManager } from '../../../../app/ui-cached-collection/client';
import { sdk } from '../../../../app/utils/client/lib/SDKClient';
import { slashCommands } from '../../../../app/utils/lib/slashCommand';

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
		sdk.stream('apps', ['apps'], (key, args) => {
			switch (key) {
				case AppEvents.COMMAND_ADDED:
					this.onCommandAddedOrUpdated(...args);
					break;
				case AppEvents.COMMAND_UPDATED:
					this.onCommandAddedOrUpdated(...args);
					break;
				case AppEvents.COMMAND_REMOVED:
					this.onCommandRemovedOrDisabled(...args);
					break;
				case AppEvents.COMMAND_DISABLED:
					this.onCommandRemovedOrDisabled(...args);
					break;
			}
			this.emit(key, ...args);
		});
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
}
