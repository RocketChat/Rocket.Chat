export class AppWebsocketReceiver {
	constructor(orch) {
		this.orch = orch;
		this.streamer = new Meteor.Streamer('apps');

		this.streamer.on('app/added', this.onAppAdded.bind(this));
		this.streamer.on('command/added', this.onCommandAdded.bind(this));
		this.streamer.on('command/disabled', this.onCommandDisabled.bind(this));
		this.streamer.on('command/updated', this.onCommandUpdated.bind(this));
		this.streamer.on('command/removed', this.onCommandDisabled.bind(this));
	}

	onAppAdded(appId) {
		RocketChat.API.get(`apps/${ appId }/languages`).then((result) => {
			this.orch.parseAndLoadLanguages(result.languages);
		});
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
