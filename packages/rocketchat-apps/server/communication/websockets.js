import { AppStatus, AppStatusUtils } from '@rocket.chat/apps-ts-definition/AppStatus';

export const AppEvents = Object.freeze({
	APP_ADDED: 'app/added',
	APP_REMOVED: 'app/removed',
	APP_UPDATED: 'app/updated',
	APP_STATUS_CHANGE: 'app/statusUpdate',
	APP_SETTING_UPDATED: 'app/settingUpdated',
	COMMAND_ADDED: 'command/added',
	COMMAND_DISABLED: 'command/disabled',
	COMMAND_UPDATED: 'command/updated',
	COMMAND_REMOVED: 'command/removed'
});

export class AppServerListener {
	constructor(orch, engineStreamer, clientStreamer, recieved) {
		this.orch = orch;
		this.engineStreamer = engineStreamer;
		this.clientStreamer = clientStreamer;
		this.recieved = recieved;

		this.engineStreamer.on(AppEvents.APP_ADDED, this.onAppAdded.bind(this));
		this.engineStreamer.on(AppEvents.APP_STATUS_CHANGE, this.onAppStatusUpdated.bind(this));
		this.engineStreamer.on(AppEvents.APP_SETTING_UPDATED, this.onAppSettingUpdated.bind(this));
		this.engineStreamer.on(AppEvents.APP_REMOVED, this.onAppRemoved.bind(this));
		this.engineStreamer.on(AppEvents.COMMAND_ADDED, this.onCommandAdded.bind(this));
		this.engineStreamer.on(AppEvents.COMMAND_DISABLED, this.onCommandDisabled.bind(this));
		this.engineStreamer.on(AppEvents.COMMAND_UPDATED, this.onCommandUpdated.bind(this));
		this.engineStreamer.on(AppEvents.COMMAND_REMOVED, this.onCommandRemoved.bind(this));
	}

	onAppAdded(appId) {
		this.orch.getManager().loadOne(appId).then(() => this.clientStreamer.emit(AppEvents.APP_ADDED, appId));
	}

	onAppStatusUpdated({ appId, status }) {
		this.recieved.set(`${ AppEvents.APP_STATUS_CHANGE }_${ appId }`, { appId, status, when: new Date() });

		if (AppStatusUtils.isEnabled(status)) {
			this.orch.getManager().enable(appId)
				.then(() => this.clientStreamer.emit(AppEvents.APP_STATUS_CHANGE, { appId, status }));
		} else if (AppStatusUtils.isDisabled(status)) {
			this.orch.getManager().disable(appId, AppStatus.MANUALLY_DISABLED === status)
				.then(() => this.clientStreamer.emit(AppEvents.APP_STATUS_CHANGE, { appId, status }));
		}
	}

	onAppSettingUpdated({ appId, setting }) {
		this.recieved.set(`${ AppEvents.APP_SETTING_UPDATED }_${ appId }_${ setting.id }`, { appId, setting, when: new Date() });

		this.orch.getManager().getSettingsManager().updateAppSetting(appId, setting)
			.then(() => this.clientStreamer.emit(AppEvents.APP_SETTING_UPDATED, { appId }));
	}

	onAppRemoved(appId) {
		this.orch.getManager().remove(appId).then(() => this.clientStreamer.emit(AppEvents.APP_REMOVED, appId));
	}

	onCommandAdded(command) {
		this.clientStreamer.emit(AppEvents.COMMAND_ADDED, command);
	}

	onCommandDisabled(command) {
		this.clientStreamer.emit(AppEvents.COMMAND_DISABLED, command);
	}

	onCommandUpdated(command) {
		this.clientStreamer.emit(AppEvents.COMMAND_UPDATED, command);
	}

	onCommandRemoved(command) {
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

		this.recieved = new Map();
		this.listener = new AppServerListener(orch, this.engineStreamer, this.clientStreamer, this.recieved);
	}

	appAdded(appId) {
		this.engineStreamer.emit(AppEvents.APP_ADDED, appId);
		this.clientStreamer.emit(AppEvents.APP_ADDED, appId);
	}

	appRemoved(appId) {
		this.engineStreamer.emit(AppEvents.APP_REMOVED, appId);
		this.clientStreamer.emit(AppEvents.APP_REMOVED, appId);
	}

	appUpdated(appId) {
		this.engineStreamer.emit(AppEvents.APP_UPDATED, appId);
		this.clientStreamer.emit(AppEvents.APP_UPDATED, appId);
	}

	appStatusUpdated(appId, status) {
		if (this.recieved.has(`${ AppEvents.APP_STATUS_CHANGE }_${ appId }`)) {
			const details = this.recieved.get(`${ AppEvents.APP_STATUS_CHANGE }_${ appId }`);
			if (details.status === status) {
				this.recieved.delete(`${ AppEvents.APP_STATUS_CHANGE }_${ appId }`);
				return;
			}
		}

		this.engineStreamer.emit(AppEvents.APP_STATUS_CHANGE, { appId, status });
		this.clientStreamer.emit(AppEvents.APP_STATUS_CHANGE, { appId, status });
	}

	appSettingsChange(appId, setting) {
		if (this.recieved.has(`${ AppEvents.APP_SETTING_UPDATED }_${ appId }_${ setting.id }`)) {
			this.recieved.delete(`${ AppEvents.APP_SETTING_UPDATED }_${ appId }_${ setting.id }`);
			return;
		}

		this.engineStreamer.emit(AppEvents.APP_SETTING_UPDATED, { appId, setting });
		this.clientStreamer.emit(AppEvents.APP_SETTING_UPDATED, { appId });
	}

	commandAdded(command) {
		this.engineStreamer.emit(AppEvents.COMMAND_ADDED, command);
		this.clientStreamer.emit(AppEvents.COMMAND_ADDED, command);
	}

	commandDisabled(command) {
		this.engineStreamer.emit(AppEvents.COMMAND_DISABLED, command);
		this.clientStreamer.emit(AppEvents.COMMAND_DISABLED, command);
	}

	commandUpdated(command) {
		this.engineStreamer.emit(AppEvents.COMMAND_UPDATED, command);
		this.clientStreamer.emit(AppEvents.COMMAND_UPDATED, command);
	}

	commandRemoved(command) {
		this.engineStreamer.emit(AppEvents.COMMAND_REMOVED, command);
		this.clientStreamer.emit(AppEvents.COMMAND_REMOVED, command);
	}
}
