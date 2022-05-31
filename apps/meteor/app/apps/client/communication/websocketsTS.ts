import { Meteor } from 'meteor/meteor';
import { Emitter } from '@rocket.chat/emitter';

import { CachedCollectionManager } from '../../../ui-cached-collection';
import { loadButtons } from '../../../ui-message/client/ActionButtonSyncer';
import { slashCommands } from '../../../utils/lib/slashCommand';
import { APIClient } from '../../../utils/client';

export enum EAppEvents {
	APP_ADDED = 'app/added',
	APP_REMOVED = 'app/removed',
	APP_UPDATED = 'app/updated',
	APP_STATUS_CHANGE = 'app/statusUpdate',
	APP_SETTING_UPDATED = 'app/settingUpdated',
	COMMAND_ADDED = 'command/added',
	COMMAND_DISABLED = 'command/disabled',
	COMMAND_UPDATED = 'command/updated',
	COMMAND_REMOVED = 'command/removed',
	ACTIONS_CHANGED = 'actions/changed',
}

export class AppWebsocketReceiver extends Emitter {
	private streamer: import('meteor/rocketchat:streamer').IStreamer;

	constructor() {
		super();

		this.streamer = new Meteor.Streamer('apps');

		CachedCollectionManager.onLogin(() => {
			this.streamer.emit(EAppEvents.COMMAND_ADDED);
			this.listenStreamerEvents();
		});
	}

	public listenStreamerEvents(): void {
		const events = Object.keys(EAppEvents).filter((v) => isNaN(Number(v)));

		for (const eventName of events) {
			if (eventName) {
				this.streamer.on(eventName, () => this.emit(eventName));
			}
		}

		this.streamer.on(EAppEvents.COMMAND_ADDED, this.onCommandAddedOrUpdated);
		this.streamer.on(EAppEvents.COMMAND_UPDATED, this.onCommandAddedOrUpdated);
		this.streamer.on(EAppEvents.COMMAND_REMOVED, this.onCommandRemovedOrDisabled);
		this.streamer.on(EAppEvents.COMMAND_DISABLED, this.onCommandRemovedOrDisabled);
		this.streamer.on(EAppEvents.ACTIONS_CHANGED, this.onActionsChanged);
	}

	public registerListener(event: EAppEvents, listener: () => any): void {
		this.on(event, listener);
	}

	public unregisterListener(event: EAppEvents, listener: () => any): void {
		this.off(event, listener);
	}

	public onCommandAddedOrUpdated = (command: any): void => {
		APIClient.v1.get('commands.get', { command }).then((result) => {
			slashCommands.commands[command] = result.command;
		});
	};

	public onCommandRemovedOrDisabled = (command: any): void => {
		delete slashCommands.commands[command];
	};

	public onActionsChanged = (): Promise<void> => loadButtons();
}
