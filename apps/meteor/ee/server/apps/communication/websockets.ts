/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { AppStatus } from '@rocket.chat/apps-engine/definition/AppStatus';
import { AppStatusUtils } from '@rocket.chat/apps-engine/definition/AppStatus';
import type { ISetting } from '@rocket.chat/core-typings';
import type { IStreamer } from 'meteor/rocketchat:streamer';
import { api } from '@rocket.chat/core-services';

import { SystemLogger } from '../../../../server/lib/logger/system';
import notifications from '../../../../app/notifications/server/lib/Notifications';
import type { AppServerOrchestrator } from '../orchestrator';
import { AppEvents } from './events';

export { AppEvents };
export class AppServerListener {
	private orch: AppServerOrchestrator;

	engineStreamer: IStreamer;

	clientStreamer: IStreamer;

	received;

	constructor(orch: AppServerOrchestrator, engineStreamer: IStreamer, clientStreamer: IStreamer, received: Map<any, any>) {
		this.orch = orch;
		this.engineStreamer = engineStreamer;
		this.clientStreamer = clientStreamer;
		this.received = received;

		this.engineStreamer.on(AppEvents.APP_STATUS_CHANGE, this.onAppStatusUpdated.bind(this));
		this.engineStreamer.on(AppEvents.APP_REMOVED, this.onAppRemoved.bind(this));
		this.engineStreamer.on(AppEvents.APP_UPDATED, this.onAppUpdated.bind(this));
		this.engineStreamer.on(AppEvents.APP_ADDED, this.onAppAdded.bind(this));
		this.engineStreamer.on(AppEvents.ACTIONS_CHANGED, this.onActionsChanged.bind(this));

		this.engineStreamer.on(AppEvents.APP_SETTING_UPDATED, this.onAppSettingUpdated.bind(this));
		this.engineStreamer.on(AppEvents.COMMAND_ADDED, this.onCommandAdded.bind(this));
		this.engineStreamer.on(AppEvents.COMMAND_DISABLED, this.onCommandDisabled.bind(this));
		this.engineStreamer.on(AppEvents.COMMAND_UPDATED, this.onCommandUpdated.bind(this));
		this.engineStreamer.on(AppEvents.COMMAND_REMOVED, this.onCommandRemoved.bind(this));
	}

	async onAppAdded(appId: string): Promise<void> {
		await (this.orch.getManager()! as any).loadOne(appId); // TO-DO: fix type
		this.clientStreamer.emitWithoutBroadcast(AppEvents.APP_ADDED, appId);
	}

	async onAppStatusUpdated({ appId, status }: { appId: string; status: AppStatus }): Promise<void> {
		const app = this.orch.getManager()?.getOneById(appId);

		if (!app || app.getStatus() === status) {
			return;
		}

		this.received.set(`${AppEvents.APP_STATUS_CHANGE}_${appId}`, {
			appId,
			status,
			when: new Date(),
		});

		if (AppStatusUtils.isEnabled(status)) {
			await this.orch.getManager()?.enable(appId).catch(SystemLogger.error);
			this.clientStreamer.emitWithoutBroadcast(AppEvents.APP_STATUS_CHANGE, { appId, status });
		} else if (AppStatusUtils.isDisabled(status)) {
			await this.orch.getManager()?.disable(appId, status, true).catch(SystemLogger.error);
			this.clientStreamer.emitWithoutBroadcast(AppEvents.APP_STATUS_CHANGE, { appId, status });
		}
	}

	async onAppSettingUpdated({ appId, setting }: { appId: string; setting: ISetting }): Promise<void> {
		this.received.set(`${AppEvents.APP_SETTING_UPDATED}_${appId}_${setting._id}`, {
			appId,
			setting,
			when: new Date(),
		});
		await this.orch
			.getManager()!
			.getSettingsManager()
			.updateAppSetting(appId, setting as any); // TO-DO: fix type of `setting`
		this.clientStreamer.emitWithoutBroadcast(AppEvents.APP_SETTING_UPDATED, { appId });
	}

	async onAppUpdated(appId: string): Promise<void> {
		this.received.set(`${AppEvents.APP_UPDATED}_${appId}`, { appId, when: new Date() });

		const storageItem = await this.orch.getStorage()!.retrieveOne(appId);

		const appPackage = await this.orch.getAppSourceStorage()!.fetch(storageItem);

		await this.orch.getManager()!.updateLocal(storageItem, appPackage);

		this.clientStreamer.emitWithoutBroadcast(AppEvents.APP_UPDATED, appId);
	}

	async onAppRemoved(appId: string): Promise<void> {
		const app = this.orch.getManager()!.getOneById(appId);

		if (!app) {
			return;
		}

		await this.orch.getManager()!.removeLocal(appId);
		this.clientStreamer.emitWithoutBroadcast(AppEvents.APP_REMOVED, appId);
	}

	async onCommandAdded(command: string): Promise<void> {
		this.clientStreamer.emitWithoutBroadcast(AppEvents.COMMAND_ADDED, command);
	}

	async onCommandDisabled(command: string): Promise<void> {
		this.clientStreamer.emitWithoutBroadcast(AppEvents.COMMAND_DISABLED, command);
	}

	async onCommandUpdated(command: string): Promise<void> {
		this.clientStreamer.emitWithoutBroadcast(AppEvents.COMMAND_UPDATED, command);
	}

	async onCommandRemoved(command: string): Promise<void> {
		this.clientStreamer.emitWithoutBroadcast(AppEvents.COMMAND_REMOVED, command);
	}

	async onActionsChanged(): Promise<void> {
		this.clientStreamer.emitWithoutBroadcast(AppEvents.ACTIONS_CHANGED);
	}
}

export class AppServerNotifier {
	engineStreamer: IStreamer;

	clientStreamer: IStreamer;

	received: Map<any, any>;

	listener: AppServerListener;

	constructor(orch: AppServerOrchestrator) {
		this.engineStreamer = notifications.streamAppsEngine;

		// This is used to broadcast to the web clients
		this.clientStreamer = notifications.streamApps;

		this.received = new Map();
		this.listener = new AppServerListener(orch, this.engineStreamer, this.clientStreamer, this.received);
	}

	async appAdded(appId: string): Promise<void> {
		api.broadcast('apps.added', appId);
	}

	async appRemoved(appId: string): Promise<void> {
		api.broadcast('apps.removed', appId);
	}

	async appUpdated(appId: string): Promise<void> {
		if (this.received.has(`${AppEvents.APP_UPDATED}_${appId}`)) {
			this.received.delete(`${AppEvents.APP_UPDATED}_${appId}`);
			return;
		}

		api.broadcast('apps.updated', appId);
	}

	async appStatusUpdated(appId: string, status: AppStatus): Promise<void> {
		if (this.received.has(`${AppEvents.APP_STATUS_CHANGE}_${appId}`)) {
			const details = this.received.get(`${AppEvents.APP_STATUS_CHANGE}_${appId}`);
			if (details.status === status) {
				this.received.delete(`${AppEvents.APP_STATUS_CHANGE}_${appId}`);
				return;
			}
		}

		api.broadcast('apps.statusUpdate', appId, status);
	}

	async appSettingsChange(appId: string, setting: ISetting): Promise<void> {
		if (this.received.has(`${AppEvents.APP_SETTING_UPDATED}_${appId}_${setting._id}`)) {
			this.received.delete(`${AppEvents.APP_SETTING_UPDATED}_${appId}_${setting._id}`);
			return;
		}

		api.broadcast('apps.settingUpdated', appId, setting);
	}

	async commandAdded(command: string): Promise<void> {
		api.broadcast('command.added', command);
	}

	async commandDisabled(command: string): Promise<void> {
		api.broadcast('command.disabled', command);
	}

	async commandUpdated(command: string): Promise<void> {
		api.broadcast('command.updated', command);
	}

	async commandRemoved(command: string): Promise<void> {
		api.broadcast('command.removed', command);
	}

	async actionsChanged(): Promise<void> {
		api.broadcast('actions.changed');
	}
}
