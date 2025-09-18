import type { IMessage, SlashCommand } from '@rocket.chat/core-typings';
import { Random } from '@rocket.chat/random';
import { escapeHTML } from '@rocket.chat/string-helpers';

import { hasAtLeastOnePermission } from '../../../../app/authorization/client';
import { slashCommands } from '../../../../app/utils/client';
import { sdk } from '../../../../app/utils/client/lib/SDKClient';
import { t } from '../../../../app/utils/lib/i18n';
import { settings } from '../../settings';
import type { ChatAPI } from '../ChatAPI';

const parse = (msg: string): { command: string; params: string } | { command: SlashCommand; params: string } | undefined => {
	// Matches "/<cmd> <params...>" and keeps parameters unchanged; an optional "<label>:" is stripped only if it matches the command's declared parameters (e.g., "channel: #", "username: @").
	// This regex allows extracting the command and its parameters, with any optional label removed afterwards.
	const match = msg.match(/^\/(\S+)\s*(.*)$/);
	if (!match) {
		return undefined;
	}

	const cmd = match[1];
	let params = match[2] ?? '';

	// that the composer may have inserted (e.g., "channel: #", "username: @").
	const meta = slashCommands.commands[cmd];
	if (meta && typeof meta !== 'string' && typeof meta.params === 'string' && meta.params) {
		const raw = meta.params;
		const label = raw.startsWith('@') || raw.startsWith('#') ? raw.slice(1) : raw;

		if (label) {
			// Used to avoid issues with special characters in the label.
			const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
			const re = new RegExp(`^\\s*(?:${esc(label)})\\s*:\\s*`);
			if (re.test(params)) {
				// Replaces the label with an empty string to make parameters suitable for parsing.
				params = params.replace(re, '');
			}
		}
	}

	if (!meta) {
		return { command: cmd, params };
	}

	return { command: meta, params };
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
		if (!settings.peek('Message_AllowUnrecognizedSlashCommand')) {
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

	const triggerId = chat.ActionManager.generateTriggerId(appId);

	const data = {
		cmd: commandName,
		params,
		msg: message,
		userId: chat.uid,
	} as const;

	try {
		if (appId) {
			chat.ActionManager.notifyBusy();
		}

		const result = await sdk.call('slashCommand', { cmd: commandName, params, msg: message, triggerId });

		handleResult?.(undefined, result, data);
	} catch (error: unknown) {
		await warnUnrecognizedSlashCommand(chat, t('Something_went_wrong_while_executing_command', { command: commandName }));
		handleResult?.(error, undefined, data);
	}

	if (appId) {
		chat.ActionManager.notifyIdle();
	}

	return true;
};
