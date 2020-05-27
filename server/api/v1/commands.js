import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';

import { slashCommands } from '../../../app/utils';
import { Rooms, Messages } from '../../../app/models';
import { API } from '../api';

API.v1.addRoute('commands.get', { authRequired: true }, {
	get() {
		const params = this.queryParams;

		if (typeof params.command !== 'string') {
			return API.v1.failure('The query param "command" must be provided.');
		}

		const cmd = slashCommands.commands[params.command.toLowerCase()];

		if (!cmd) {
			return API.v1.failure(`There is no command in the system by the name of: ${ params.command }`);
		}

		return API.v1.success({ command: cmd });
	},
});

API.v1.addRoute('commands.list', { authRequired: true }, {
	get() {
		const { offset, count } = this.getPaginationItems();
		const { sort, fields, query } = this.parseJsonQuery();

		let commands = Object.values(slashCommands.commands);

		if (query && query.command) {
			commands = commands.filter((command) => command.command === query.command);
		}

		const totalCount = commands.length;
		commands = Rooms.processQueryOptionsOnResult(commands, {
			sort: sort || { name: 1 },
			skip: offset,
			limit: count,
			fields,
		});

		return API.v1.success({
			commands,
			offset,
			count: commands.length,
			total: totalCount,
		});
	},
});

// Expects a body of: { command: 'gimme', params: 'any string value', roomId: 'value', triggerId: 'value' }
API.v1.addRoute('commands.run', { authRequired: true }, {
	post() {
		const body = this.bodyParams;
		const user = this.getLoggedInUser();

		if (typeof body.command !== 'string') {
			return API.v1.failure('You must provide a command to run.');
		}

		if (body.params && typeof body.params !== 'string') {
			return API.v1.failure('The parameters for the command must be a single string.');
		}

		if (typeof body.roomId !== 'string') {
			return API.v1.failure('The room\'s id where to execute this command must be provided and be a string.');
		}

		if (body.tmid && typeof body.tmid !== 'string') {
			return API.v1.failure('The tmid parameter when provided must be a string.');
		}

		const cmd = body.command.toLowerCase();
		if (!slashCommands.commands[cmd]) {
			return API.v1.failure('The command provided does not exist (or is disabled).');
		}

		// This will throw an error if they can't or the room is invalid
		Meteor.call('canAccessRoom', body.roomId, user._id);

		const params = body.params ? body.params : '';
		const message = {
			_id: Random.id(),
			rid: body.roomId,
			msg: `/${ cmd } ${ params }`,
		};

		if (body.tmid) {
			const thread = Messages.findOneById(body.tmid);
			if (!thread || thread.rid !== body.roomId) {
				return API.v1.failure('Invalid thread.');
			}
			message.tmid = body.tmid;
		}

		const { triggerId } = body;

		const result = Meteor.runAsUser(user._id, () => slashCommands.run(cmd, params, message, triggerId));

		return API.v1.success({ result });
	},
});

API.v1.addRoute('commands.preview', { authRequired: true }, {
	// Expects these query params: command: 'giphy', params: 'mine', roomId: 'value'
	get() {
		const query = this.queryParams;
		const user = this.getLoggedInUser();

		if (typeof query.command !== 'string') {
			return API.v1.failure('You must provide a command to get the previews from.');
		}

		if (query.params && typeof query.params !== 'string') {
			return API.v1.failure('The parameters for the command must be a single string.');
		}

		if (typeof query.roomId !== 'string') {
			return API.v1.failure('The room\'s id where the previews are being displayed must be provided and be a string.');
		}

		const cmd = query.command.toLowerCase();
		if (!slashCommands.commands[cmd]) {
			return API.v1.failure('The command provided does not exist (or is disabled).');
		}

		// This will throw an error if they can't or the room is invalid
		Meteor.call('canAccessRoom', query.roomId, user._id);

		const params = query.params ? query.params : '';

		let preview;
		Meteor.runAsUser(user._id, () => {
			preview = Meteor.call('getSlashCommandPreviews', { cmd, params, msg: { rid: query.roomId } });
		});

		return API.v1.success({ preview });
	},
	// Expects a body format of: { command: 'giphy', params: 'mine', roomId: 'value', tmid: 'value', triggerId: 'value', previewItem: { id: 'sadf8' type: 'image', value: 'https://dev.null/gif' } }
	post() {
		const body = this.bodyParams;
		const user = this.getLoggedInUser();

		if (typeof body.command !== 'string') {
			return API.v1.failure('You must provide a command to run the preview item on.');
		}

		if (body.params && typeof body.params !== 'string') {
			return API.v1.failure('The parameters for the command must be a single string.');
		}

		if (typeof body.roomId !== 'string') {
			return API.v1.failure('The room\'s id where the preview is being executed in must be provided and be a string.');
		}

		if (typeof body.previewItem === 'undefined') {
			return API.v1.failure('The preview item being executed must be provided.');
		}

		if (!body.previewItem.id || !body.previewItem.type || typeof body.previewItem.value === 'undefined') {
			return API.v1.failure('The preview item being executed is in the wrong format.');
		}

		if (body.tmid && typeof body.tmid !== 'string') {
			return API.v1.failure('The tmid parameter when provided must be a string.');
		}

		if (body.triggerId && typeof body.triggerId !== 'string') {
			return API.v1.failure('The triggerId parameter when provided must be a string.');
		}

		const cmd = body.command.toLowerCase();
		if (!slashCommands.commands[cmd]) {
			return API.v1.failure('The command provided does not exist (or is disabled).');
		}

		// This will throw an error if they can't or the room is invalid
		Meteor.call('canAccessRoom', body.roomId, user._id);

		const params = body.params ? body.params : '';
		const message = {
			rid: body.roomId,
		};

		if (body.tmid) {
			const thread = Messages.findOneById(body.tmid);
			if (!thread || thread.rid !== body.roomId) {
				return API.v1.failure('Invalid thread.');
			}
			message.tmid = body.tmid;
		}

		Meteor.runAsUser(user._id, () => {
			Meteor.call('executeSlashCommandPreview', {
				cmd,
				params,
				msg: { rid: body.roomId, tmid: body.tmid },
			}, body.previewItem, body.triggerId);
		});

		return API.v1.success();
	},
});
