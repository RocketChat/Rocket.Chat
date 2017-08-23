export class RocketletWebsocketReceiver {
	constructor(orch) {
		this.orch = orch;
		this.streamer = new Meteor.Streamer('rocketlets');

		this.streamer.on('command/added', this.onCommandAdded.bind(this));
		this.streamer.on('command/disabled', this.onCommandDisabled.bind(this));
		this.streamer.on('command/updated', this.onCommandUpdated.bind(this));
	}

	onCommandAdded(command) {
		RocketChat.API.v1.get('commands.getOne', { command }).then((result) => {
			RocketChat.slashCommands.commands[command] = result.command;
		});
	}

	onCommandDisabled(command) {
		delete RocketChat.slashCommands.commands[command];
	}

	onCommandUpdated(command) {
		RocketChat.API.v1.get('commands.getOne', { command }).then((result) => {
			RocketChat.slashCommands.commands[command] = result.command;
		});
	}
}
