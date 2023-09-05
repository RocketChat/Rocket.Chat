import type { IMessage, SlashCommand } from '@rocket.chat/core-typings';
import { Random } from '@rocket.chat/random';
import { escapeHTML } from '@rocket.chat/string-helpers';

import { hasAtLeastOnePermission } from '../../../../app/authorization/client';
import { settings } from '../../../../app/settings/client';
import { generateTriggerId } from '../../../../app/ui-message/client/ActionManager';
import { slashCommands } from '../../../../app/utils/client';
import { sdk } from '../../../../app/utils/client/lib/SDKClient';
import { t } from '../../../../app/utils/lib/i18n';
import type { ChatAPI } from '../ChatAPI';

const parse = (msg: string): { command: string; params: string } | { command: SlashCommand; params: string } | undefined => {
	const match = msg.match(/^\/([^\s]+)(.*)/);

	if (!match) {
		return undefined;
	}

	const [, cmd, params] = match;
	const command = slashCommands.commands[cmd];

	if (!command) {
		return { command: cmd, params };
	}

	return { command, params };
};

const warnUnrecognizedSlashCommand = async (chat: ChatAPI, message: string): Promise<void> => {
	console.error(message);

	await chat.data.pushEphemeralMessage({
		_id: Random.id(),
		ts: new Date(),
		msg: message,
		u: {
			_id: 'rocket.cat',
			username: 'rocket.cat',
			name: 'Rocket.Cat',
		},
		private: true,
		_updatedAt: new Date(),
	});
};

export const processSlashCommand = async (chat: ChatAPI, message: IMessage): Promise<boolean> => {
	const match = parse(message.msg);

	if (!match) {
		return false;
	}

	const { command, params } = match;

	if (typeof command === 'string') {
		if (!settings.get('Message_AllowUnrecognizedSlashCommand')) {
			await warnUnrecognizedSlashCommand(chat, t('No_such_command', { command: escapeHTML(command) }));
			return true;
		}

		return false;
	}

	const { permission, clientOnly, callback: handleOnClient, result: handleResult, appId, command: commandName } = command;

	if (permission && !hasAtLeastOnePermission(permission, message.rid)) {
		await warnUnrecognizedSlashCommand(chat, t('You_do_not_have_permission_to_execute_this_command', { command: escapeHTML(commandName) }));
		return true;
	}

	if (clientOnly && chat.uid) {
		handleOnClient?.({ command: commandName, message, params, userId: chat.uid });
		return true;
	}

	await sdk.rest.post('/v1/statistics.telemetry', {
		params: [{ eventName: 'slashCommandsStats', timestamp: Date.now(), command: commandName }],
	});

	const triggerId = generateTriggerId(appId);

	const data = {
		cmd: commandName,
		params,
		msg: message,
		userId: chat.uid,
	} as const;

	try {
		if (appId) {
			chat.ActionManager.events.emit('busy', { busy: true });
		}

		const result = await sdk.call('slashCommand', { cmd: commandName, params, msg: message, triggerId });

		handleResult?.(undefined, result, data);
	} catch (error: unknown) {
		await warnUnrecognizedSlashCommand(chat, t('Something_went_wrong_while_executing_command', { command: commandName }));
		handleResult?.(error, undefined, data);
	}

	if (appId) {
		chat.ActionManager.events.emit('busy', { busy: false });
	}

	return true;
};
