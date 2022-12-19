import type { IMessage, SlashCommand } from '@rocket.chat/core-typings';
import { escapeHTML } from '@rocket.chat/string-helpers';

import { hasAtLeastOnePermission } from '../../../../app/authorization/client';
import { settings } from '../../../../app/settings/client';
import { generateTriggerId } from '../../../../app/ui-message/client/ActionManager';
import { slashCommands, APIClient, t } from '../../../../app/utils/client';
import { getRandomId } from '../../../../lib/random';
import { call } from '../../utils/call';
import type { ChatAPI } from '../ChatAPI';

const parse = (msg: string): { command: string; params: string } | { command: SlashCommand; params: string } | undefined => {
	const match = msg.match(/^\/([^\s]+)(.*)/m);

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

const warnUnrecognizedSlashCommand = async (chat: ChatAPI, command: string): Promise<void> => {
	console.error(t('No_such_command', { command: escapeHTML(command) }));

	await chat.data.pushEphemeralMessage({
		_id: getRandomId(),
		ts: new Date(),
		msg: t('No_such_command', { command: escapeHTML(command) }),
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
			await warnUnrecognizedSlashCommand(chat, command);
			return true;
		}

		return false;
	}

	const { permission, clientOnly, callback: handleOnClient, result: handleResult, appId, command: commandName } = command;

	if (permission && !hasAtLeastOnePermission(permission)) {
		return false;
	}

	if (clientOnly) {
		handleOnClient?.(commandName, params, message);
		return true;
	}

	await APIClient.post('/v1/statistics.telemetry', {
		params: [{ eventName: 'slashCommandsStats', timestamp: Date.now(), command: commandName }],
	});

	const triggerId = generateTriggerId(appId);

	const data = {
		cmd: commandName,
		params,
		msg: message,
	} as const;

	try {
		const result = await call('slashCommand', { cmd: commandName, params, msg: message, triggerId });
		handleResult?.(undefined, result, data);
	} catch (error: unknown) {
		handleResult?.(error, undefined, data);
	}

	return true;
};
