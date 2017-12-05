RocketChat.API.v1.addRoute('commands.get', { authRequired: true }, {
	get() {
		const params = this.queryParams;

		if (typeof params.command !== 'string') {
			return RocketChat.API.v1.failure('The query param "command" must be provided.');
		}

		const cmd = RocketChat.slashCommands.commands[params.command.toLowerCase()];

		if (!cmd) {
			return RocketChat.API.v1.failure(`There is no command in the system by the name of: ${ params.command }`);
		}

		return RocketChat.API.v1.success({ command: cmd });
	}
});

RocketChat.API.v1.addRoute('commands.list', { authRequired: true }, {
	get() {
		const { offset, count } = this.getPaginationItems();
		const { sort, fields, query } = this.parseJsonQuery();

		let commands = Object.values(RocketChat.slashCommands.commands);

		if (query && query.command) {
			commands = commands.filter((command) => command.command === query.command);
		}

		const totalCount = commands.length;
		commands = RocketChat.models.Rooms.processQueryOptionsOnResult(commands, {
			sort: sort ? sort : { name: 1 },
			skip: offset,
			limit: count,
			fields
		});

		return RocketChat.API.v1.success({
			commands,
			offset,
			count: commands.length,
			total: totalCount
		});
	}
});

// Expects a body of: { command: 'gimme', params: 'any string value', roomId: 'value' }
RocketChat.API.v1.addRoute('commands.run', { authRequired: true }, {
	post() {
		const body = this.bodyParams;
		const user = this.getLoggedInUser();

		if (typeof body.command !== 'string') {
			return RocketChat.API.v1.failure('You must provide a command to run.');
		}

		if (body.params && typeof body.params !== 'string') {
			return RocketChat.API.v1.failure('The parameters for the command must be a single string.');
		}

		if (typeof body.roomId !== 'string') {
			return RocketChat.API.v1.failure('The room\'s id where to execute this command must provided and be a string.');
		}

		const cmd = body.command.toLowerCase();
		if (!RocketChat.slashCommands.commands[body.command.toLowerCase()]) {
			return RocketChat.API.v1.failure('The command provided does not exist (or is disabled).');
		}

		// This will throw an error if they can't or the room is invalid
		Meteor.call('canAccessRoom', body.roomId, user._id);

		const params = body.params ? body.params : '';

		let result;
		Meteor.runAsUser(user._id, () => {
			result = RocketChat.slashCommands.run(cmd, params, {
				_id: Random.id(),
				rid: body.roomId,
				msg: `/${ cmd } ${ params }`
			});
		});

		return RocketChat.API.v1.success({ result });
	}
});
