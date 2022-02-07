import { Meteor } from 'meteor/meteor';

export const slashCommands = {
	commands: {},
	add: function _addingSlashCommand(command, callback, options = {}, result, providesPreview = false, previewer, previewCallback) {
		slashCommands.commands[command] = {
			command,
			callback,
			params: options.params,
			description: options.description,
			permission: options.permission,
			clientOnly: options.clientOnly || false,
			result,
			providesPreview,
			previewer,
			previewCallback,
		};
	},
	run: function _runningSlashCommand(command, params, message, triggerId) {
		if (slashCommands.commands[command] && typeof slashCommands.commands[command].callback === 'function') {
			if (!message || !message.rid) {
				throw new Meteor.Error('invalid-command-usage', 'Executing a command requires at least a message with a room id.');
			}
			return slashCommands.commands[command].callback(command, params, message, triggerId);
		}
	},
	getPreviews: function _gettingSlashCommandPreviews(command, params, message) {
		if (slashCommands.commands[command] && typeof slashCommands.commands[command].previewer === 'function') {
			if (!message || !message.rid) {
				throw new Meteor.Error('invalid-command-usage', 'Executing a command requires at least a message with a room id.');
			}

			// { i18nTitle, items: [{ id, type, value }] }
			const previewInfo = slashCommands.commands[command].previewer(command, params, message);

			if (typeof previewInfo !== 'object' || !Array.isArray(previewInfo.items) || previewInfo.items.length === 0) {
				return;
			}

			// A limit of ten results, to save time and bandwidth
			if (previewInfo.items.length >= 10) {
				previewInfo.items = previewInfo.items.slice(0, 10);
			}

			return previewInfo;
		}
	},
	executePreview: function _executeSlashCommandPreview(command, params, message, preview, triggerId) {
		if (slashCommands.commands[command] && typeof slashCommands.commands[command].previewCallback === 'function') {
			if (!message || !message.rid) {
				throw new Meteor.Error('invalid-command-usage', 'Executing a command requires at least a message with a room id.');
			}

			// { id, type, value }
			if (!preview.id || !preview.type || !preview.value) {
				throw new Meteor.Error('error-invalid-preview', 'Preview Item must have an id, type, and value.');
			}

			return slashCommands.commands[command].previewCallback(command, params, message, preview, triggerId);
		}
	},
};

Meteor.methods({
	slashCommand(command) {
		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'slashCommand',
			});
		}

		if (!command || !command.cmd || !slashCommands.commands[command.cmd]) {
			throw new Meteor.Error('error-invalid-command', 'Invalid Command Provided', {
				method: 'executeSlashCommandPreview',
			});
		}
		return slashCommands.run(command.cmd, command.params, command.msg, command.triggerId);
	},
});
