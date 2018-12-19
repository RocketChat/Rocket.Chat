import { Meteor } from 'meteor/meteor';
import { AppStatus, AppStatusUtils } from '@rocket.chat/apps-engine/definition/AppStatus';

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
});

export class AppServerListener {
	constructor(orch, engineStreamer, clientStreamer, received) {
		this.orch = orch;
		this.engineStreamer = engineStreamer;
		this.clientStreamer = clientStreamer;
		this.received = received;

		this.engineStreamer.on(AppEvents.APP_ADDED, this.onAppAdded.bind(this));
		this.engineStreamer.on(AppEvents.APP_STATUS_CHANGE, this.onAppStatusUpdated.bind(this));
		this.engineStreamer.on(AppEvents.APP_SETTING_UPDATED, this.onAppSettingUpdated.bind(this));
		this.engineStreamer.on(AppEvents.APP_REMOVED, this.onAppRemoved.bind(this));
		this.engineStreamer.on(AppEvents.APP_UPDATED, this.onAppUpdated.bind(this));
		this.engineStreamer.on(AppEvents.COMMAND_ADDED, this.onCommandAdded.bind(this));
		this.engineStreamer.on(AppEvents.COMMAND_DISABLED, this.onCommandDisabled.bind(this));
		this.engineStreamer.on(AppEvents.COMMAND_UPDATED, this.onCommandUpdated.bind(this));
		this.engineStreamer.on(AppEvents.COMMAND_REMOVED, this.onCommandRemoved.bind(this));
	}

	async onAppAdded(appId) {
		await this.orch.getManager().loadOne(appId);
		this.clientStreamer.emit(AppEvents.APP_ADDED, appId);
	}

	async onAppStatusUpdated({ appId, status }) {
		this.received.set(`${ AppEvents.APP_STATUS_CHANGE }_${ appId }`, { appId, status, when: new Date() });

		if (AppStatusUtils.isEnabled(status)) {
			await this.orch.getManager().enable(appId);
			this.clientStreamer.emit(AppEvents.APP_STATUS_CHANGE, { appId, status });
		} else if (AppStatusUtils.isDisabled(status)) {
			await this.orch.getManager().disable(appId, AppStatus.MANUALLY_DISABLED === status);
			this.clientStreamer.emit(AppEvents.APP_STATUS_CHANGE, { appId, status });
		}
	}

	async onAppSettingUpdated({ appId, setting }) {
		this.received.set(`${ AppEvents.APP_SETTING_UPDATED }_${ appId }_${ setting.id }`, { appId, setting, when: new Date() });

		await this.orch.getManager().getSettingsManager().updateAppSetting(appId, setting);
		this.clientStreamer.emit(AppEvents.APP_SETTING_UPDATED, { appId });
	}

	async onAppUpdated(appId) {
		this.received.set(`${ AppEvents.APP_UPDATED }_${ appId }`, { appId, when: new Date() });

		const storageItem = await this.orch.getStorage().retrieveOne(appId);

		await this.orch.getManager().update(storageItem.zip);
		this.clientStreamer.emit(AppEvents.APP_UPDATED, appId);
	}

	async onAppRemoved(appId) {
		await this.orch.getManager().remove(appId);
		this.clientStreamer.emit(AppEvents.APP_REMOVED, appId);
	}

	async onCommandAdded(command) {
		this.clientStreamer.emit(AppEvents.COMMAND_ADDED, command);
	}

	async onCommandDisabled(command) {
		this.clientStreamer.emit(AppEvents.COMMAND_DISABLED, command);
	}

	async onCommandUpdated(command) {
		this.clientStreamer.emit(AppEvents.COMMAND_UPDATED, command);
	}

	async onCommandRemoved(command) {
		this.clientStreamer.emit(AppEvents.COMMAND_REMOVED, command);
	}
}

export class AppServerNotifier {
	constructor(orch) {
		this.engineStreamer = new Meteor.Streamer('apps-engine', { retransmit: false });
		this.engineStreamer.serverOnly = true;
		this.engineStreamer.allowRead('none');
		this.engineStreamer.allowEmit('all');
		this.engineStreamer.allowWrite('none');

		// This is used to broadcast to the web clients
		this.clientStreamer = new Meteor.Streamer('apps', { retransmit: false });
		this.clientStreamer.serverOnly = true;
		this.clientStreamer.allowRead('all');
		this.clientStreamer.allowEmit('all');
		this.clientStreamer.allowWrite('none');

		this.received = new Map();
		this.listener = new AppServerListener(orch, this.engineStreamer, this.clientStreamer, this.received);
	}

	async appAdded(appId) {
		this.engineStreamer.emit(AppEvents.APP_ADDED, appId);
		this.clientStreamer.emit(AppEvents.APP_ADDED, appId);
	}

	async appRemoved(appId) {
		this.engineStreamer.emit(AppEvents.APP_REMOVED, appId);
		this.clientStreamer.emit(AppEvents.APP_REMOVED, appId);
	}

	async appUpdated(appId) {
		if (this.received.has(`${ AppEvents.APP_UPDATED }_${ appId }`)) {
			this.received.delete(`${ AppEvents.APP_UPDATED }_${ appId }`);
			return;
		}

		this.engineStreamer.emit(AppEvents.APP_UPDATED, appId);
		this.clientStreamer.emit(AppEvents.APP_UPDATED, appId);
	}

	async appStatusUpdated(appId, status) {
		if (this.received.has(`${ AppEvents.APP_STATUS_CHANGE }_${ appId }`)) {
			const details = this.received.get(`${ AppEvents.APP_STATUS_CHANGE }_${ appId }`);
			if (details.status === status) {
				this.received.delete(`${ AppEvents.APP_STATUS_CHANGE }_${ appId }`);
				return;
			}
		}

		this.engineStreamer.emit(AppEvents.APP_STATUS_CHANGE, { appId, status });
		this.clientStreamer.emit(AppEvents.APP_STATUS_CHANGE, { appId, status });
	}

	async appSettingsChange(appId, setting) {
		if (this.received.has(`${ AppEvents.APP_SETTING_UPDATED }_${ appId }_${ setting.id }`)) {
			this.received.delete(`${ AppEvents.APP_SETTING_UPDATED }_${ appId }_${ setting.id }`);
			return;
		}

		this.engineStreamer.emit(AppEvents.APP_SETTING_UPDATED, { appId, setting });
		this.clientStreamer.emit(AppEvents.APP_SETTING_UPDATED, { appId });
	}

	async commandAdded(command) {
		this.engineStreamer.emit(AppEvents.COMMAND_ADDED, command);
		this.clientStreamer.emit(AppEvents.COMMAND_ADDED, command);
	}

	async commandDisabled(command) {
		this.engineStreamer.emit(AppEvents.COMMAND_DISABLED, command);
		this.clientStreamer.emit(AppEvents.COMMAND_DISABLED, command);
	}

	async commandUpdated(command) {
		this.engineStreamer.emit(AppEvents.COMMAND_UPDATED, command);
		this.clientStreamer.emit(AppEvents.COMMAND_UPDATED, command);
	}

	async commandRemoved(command) {
		this.engineStreamer.emit(AppEvents.COMMAND_REMOVED, command);
		this.clientStreamer.emit(AppEvents.COMMAND_REMOVED, command);
	}
}
