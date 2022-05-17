import { Meteor } from 'meteor/meteor';
import { Emitter } from '@rocket.chat/emitter';
import { IStreamer } from 'meteor/rocketchat:streamer';

import { slashCommands } from '../../../utils/server';
import { APIClient } from '../../../utils/client';
import { CachedCollectionManager } from '../../../ui-cached-collection';
import { loadButtons } from '../../../ui-message/client/ActionButtonSyncer';

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
	streamer: IStreamer;

	constructor() {
		super();

		this.streamer = new Meteor.Streamer('apps');

		CachedCollectionManager.onLogin(() => {
			this.listenStreamerEvents();
		});
	}

	listenStreamerEvents(): void {
		Object.values(AppEvents).forEach((eventName) => {
			this.streamer.on(eventName, (this.emit as (...data: any[]) => void).bind(this, eventName));
		});

		this.streamer.on(AppEvents.COMMAND_ADDED, this.onCommandAddedOrUpdated);
		this.streamer.on(AppEvents.COMMAND_UPDATED, this.onCommandAddedOrUpdated);
		this.streamer.on(AppEvents.COMMAND_REMOVED, this.onCommandRemovedOrDisabled);
		this.streamer.on(AppEvents.COMMAND_DISABLED, this.onCommandRemovedOrDisabled);
		this.streamer.on(AppEvents.ACTIONS_CHANGED, this.onActionsChanged);
	}

	registerListener(event: string, listener: (...args: any[]) => void): void {
		this.on(event, listener);
	}

	unregisterListener(event: string, listener: (...args: any[]) => void): void {
		this.off(event, listener);
	}

	onCommandAddedOrUpdated = (command: string | number): void => {
		APIClient.v1.get('commands.get', { command }).then((result: { command: typeof command }) => {
			slashCommands.commands[command] = result.command;
		});
	};

	onCommandRemovedOrDisabled = (command: string | number): void => {
		delete slashCommands.commands[command];
	};

	onActionsChanged = (): Promise<void> => loadButtons();
}
