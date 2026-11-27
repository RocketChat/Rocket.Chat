import type { IMessage, SlashCommand } from '@rocket.chat/core-typings';

import type { ChatAPI } from '../ChatAPI';

export type SlashCommandChat = {
	readonly composer?: Pick<NonNullable<ChatAPI['composer']>, 'clear'>;
	readonly data: Pick<ChatAPI['data'], 'pushEphemeralMessage'>;
	readonly uid: ChatAPI['uid'];
	readonly ActionManager: Pick<ChatAPI['ActionManager'], 'generateTriggerId' | 'notifyBusy' | 'notifyIdle'>;
};

type TelemetryEvent = { eventName: 'slashCommandsStats'; timestamp: number; command: string };

type RunCommandParams = { command: string; params: string; roomId: string; tmid?: string; triggerId?: string };

export type SlashCommandDeps = {
	getCommand(name: string): SlashCommand | undefined;
	isUnrecognizedAllowed(): boolean | undefined;
	hasAtLeastOnePermission(permission: string | string[], rid: string): boolean;
	postTelemetry(event: TelemetryEvent): Promise<unknown>;
	runCommand(params: RunCommandParams): Promise<{ result: unknown }>;
	t(
		key: 'No_such_command' | 'You_do_not_have_permission_to_execute_this_command' | 'Something_went_wrong_while_executing_command',
		options: { command: string },
	): string;
	escapeHTML(text: string): string;
	randomId(): string;
};

const parse = (
	deps: SlashCommandDeps,
	msg: string,
): { command: string; params: string } | { command: SlashCommand; params: string } | undefined => {
	const match = msg.match(/^\/([^\s]+)(.*)/);

	if (!match) {
		return undefined;
	}

	const [, cmd, params] = match;
	const command = deps.getCommand(cmd);

	if (!command) {
		return { command: cmd, params };
	}

	return { command, params };
};

const warnUnrecognizedSlashCommand = async (deps: SlashCommandDeps, chat: SlashCommandChat, message: string): Promise<void> => {
	console.error(message);

	await chat.data.pushEphemeralMessage({
		_id: deps.randomId(),
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

export const processSlashCommandCore = async (deps: SlashCommandDeps, chat: SlashCommandChat, message: IMessage): Promise<boolean> => {
	const match = parse(deps, message.msg);

	if (!match) {
		return false;
	}

	const { command, params } = match;

	if (typeof command === 'string') {
		if (!deps.isUnrecognizedAllowed()) {
			chat.composer?.clear();
			await warnUnrecognizedSlashCommand(deps, chat, deps.t('No_such_command', { command: deps.escapeHTML(command) }));
			return true;
		}

		return false;
	}

	const { permission, clientOnly, callback: handleOnClient, result: handleResult, appId, command: commandName } = command;

	if (permission && !deps.hasAtLeastOnePermission(permission, message.rid)) {
		chat.composer?.clear();
		await warnUnrecognizedSlashCommand(
			deps,
			chat,
			deps.t('You_do_not_have_permission_to_execute_this_command', { command: deps.escapeHTML(commandName) }),
		);
		return true;
	}

	if (clientOnly && chat.uid) {
		chat.composer?.clear();
		handleOnClient?.({ command: commandName, message, params, userId: chat.uid });
		return true;
	}

	void deps.postTelemetry({ eventName: 'slashCommandsStats', timestamp: Date.now(), command: commandName });

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

		chat.composer?.clear();
		const { result } = await deps.runCommand({
			command: commandName,
			params,
			roomId: message.rid,
			...(message.tmid && { tmid: message.tmid }),
			...(triggerId && { triggerId }),
		});

		handleResult?.(undefined, result, data);
	} catch (error: unknown) {
		await warnUnrecognizedSlashCommand(deps, chat, deps.t('Something_went_wrong_while_executing_command', { command: commandName }));
		handleResult?.(error, undefined, data);
	}

	if (appId) {
		chat.ActionManager.notifyIdle();
	}

	return true;
};
