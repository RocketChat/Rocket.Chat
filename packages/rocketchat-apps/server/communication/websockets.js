import { AppStatus, AppStatusUtils } from '@rocket.chat/apps-ts-definition/AppStatus';

export const AppEvents = Object.freeze({
	APP_ADDED: 'app/added',
	APP_REMOVED: 'app/removed',
	APP_UPDATED: 'app/updated',
	APP_STATUS_CHANGE: 'app/statusUpdate',
	COMMAND_ADDED: 'command/added',
	COMMAND_DISABLED: 'command/disabled',
	COMMAND_UPDATED: 'command/updated',
	COMMAND_REMOVED: 'command/removed'
});

export class AppServerListener {
	constructor(orch, engineStreamer, clientStreamer) {
		this.orch = orch;
		this.engineStreamer = engineStreamer;
		this.clientStreamer = clientStreamer;

		this.engineStreamer.on(AppEvents.APP_ADDED, this.onAppAdded.bind(this));
		this.engineStreamer.on(AppEvents.APP_STATUS_CHANGE, this.onAppStatusUpdated.bind(this));
		this.engineStreamer.on(AppEvents.APP_REMOVED, this.onAppRemoved.bind(this));
		this.engineStreamer.on(AppEvents.COMMAND_ADDED, this.onCommandAdded.bind(this));
		this.engineStreamer.on(AppEvents.COMMAND_DISABLED, this.onCommandDisabled.bind(this));
		this.engineStreamer.on(AppEvents.COMMAND_UPDATED, this.onCommandUpdated.bind(this));
		this.engineStreamer.on(AppEvents.COMMAND_REMOVED, this.onCommandRemoved.bind(this));
	}

	onAppAdded(appId) {
		console.log('On App Added! :)', appId);
		this.orch.getManager().loadOne(appId).then(() => this.clientStreamer.emit(AppEvents.APP_ADDED, appId));
	}

	onAppStatusUpdated({ appId, status }) {
		console.log('App Status Update:', appId, status);

		if (AppStatusUtils.isEnabled(status)) {
			this.orch.getManager().enable(appId).then(() => this.clientStreamer.emit(AppEvents.APP_STATUS_CHANGE, { appId, status }));
		} else if (AppStatusUtils.isDisabled(status)) {
			this.orch.getManager().disable(appId, AppStatus.MANUALLY_DISABLED === status).then(() => this.clientStreamer.emit(AppEvents.APP_STATUS_CHANGE, { appId, status }));
		}
	}

	onAppRemoved(appId) {
		console.log('On App Removed!', appId);
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

		this.listener = new AppServerListener(orch, this.engineStreamer, this.clientStreamer);
	}

	appAdded(appId) {
		this.engineStreamer.emit('app/added', appId);
		this.clientStreamer.emit('app/added', appId);
	}

	appRemoved(appId) {
		this.engineStreamer.emit('app/removed', appId);
		this.clientStreamer.emit('app/removed', appId);
	}

	appUpdated(appId) {
		this.engineStreamer.emit('app/updated', appId);
		this.clientStreamer.emit('app/updated', appId);
	}

	appStatusUpdated(appId, status) {
		this.engineStreamer.emit('app/statusUpdate', { appId, status });
		this.clientStreamer.emit('app/statusUpdate', { appId, status });
	}

	commandAdded(command) {
		this.engineStreamer.emit('command/added', command);
		this.clientStreamer.emit('command/added', command);
	}

	commandDisabled(command) {
		this.engineStreamer.emit('command/disabled', command);
		this.clientStreamer.emit('command/disabled', command);
	}

	commandUpdated(command) {
		this.engineStreamer.emit('command/updated', command);
		this.clientStreamer.emit('command/updated', command);
	}

	commandRemoved(command) {
		this.engineStreamer.emit('command/removed', command);
		this.clientStreamer.emit('command/removed', command);
	}
}
