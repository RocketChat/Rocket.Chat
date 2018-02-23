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

export class AppWebsocketReceiver {
	constructor(orch) {
		this.orch = orch;
		this.streamer = new Meteor.Streamer('apps');

		this.streamer.on(AppEvents.APP_ADDED, this.onAppAdded.bind(this));
		this.streamer.on(AppEvents.APP_REMOVED, this.onAppRemoved.bind(this));
		this.streamer.on(AppEvents.APP_UPDATED, this.onAppUpdated.bind(this));
		this.streamer.on(AppEvents.APP_STATUS_CHANGE, this.onAppStatusUpdated.bind(this));
		this.streamer.on(AppEvents.COMMAND_ADDED, this.onCommandAdded.bind(this));
		this.streamer.on(AppEvents.COMMAND_DISABLED, this.onCommandDisabled.bind(this));
		this.streamer.on(AppEvents.COMMAND_UPDATED, this.onCommandUpdated.bind(this));
		this.streamer.on(AppEvents.COMMAND_REMOVED, this.onCommandDisabled.bind(this));
		console.log('apps websocket listener');

		this.listeners = {};

		Object.keys(AppEvents).forEach((v) => {
			this.listeners[AppEvents[v]] = [];
		});

		console.log(this.listeners);
	}

	registerListener(event, listener) {
		console.log('Registering a listener for:', event);
		this.listeners[event].push(listener);
	}

	unregisterListener(event, listener) {
		console.log('Unregistering a listener for:', event);
		this.listeners[event].splice(this.listeners[event].indexOf(listener), 1);
	}

	onAppAdded(appId) {
		console.log('app added');
		RocketChat.API.get(`apps/${ appId }/languages`).then((result) => {
			this.orch.parseAndLoadLanguages(result.languages);
		});

		this.listeners[AppEvents.APP_ADDED].forEach((listener) => listener(appId));
	}

	onAppRemoved(appId) {
		console.log('app removed', appId);
		this.listeners[AppEvents.APP_REMOVED].forEach((listener) => listener(appId));
	}

	onAppUpdated(appId) {
		console.log('app updated', appId);
	}

	onAppStatusUpdated({ appId, status }) {
		console.log('App Status Update:', appId, status);
	}

	onCommandAdded(command) {
		RocketChat.API.v1.get('commands.get', { command }).then((result) => {
			RocketChat.slashCommands.commands[command] = result.command;
		});
	}

	onCommandDisabled(command) {
		delete RocketChat.slashCommands.commands[command];
	}

	onCommandUpdated(command) {
		RocketChat.API.v1.get('commands.get', { command }).then((result) => {
			RocketChat.slashCommands.commands[command] = result.command;
		});
	}
}
