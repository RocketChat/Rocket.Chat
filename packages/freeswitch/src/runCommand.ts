import { wrapExceptions } from '@rocket.chat/tools';
import { FreeSwitchResponse, type StringMap } from 'esl';

import type { FreeSwitchOptions } from './FreeSwitchOptions';
import { connect } from './connect';
import { getCommandResponse } from './getCommandResponse';

export async function runCallback<T>(
	options: FreeSwitchOptions,
	cb: (runCommand: (command: string) => Promise<StringMap>) => Promise<T>,
): Promise<T> {
	const { host, port, password, timeout } = options;

	const call = await connect({ host, port, password });
	try {
		// Await result so it runs within the try..finally scope
		const result = await cb(async (command) => {
			const response = await call.bgapi(command, timeout ?? FreeSwitchResponse.default_command_timeout);
			return getCommandResponse(response, command);
		});

		return result;
	} finally {
		await wrapExceptions(async () => call.end()).suppress();
	}
}

export async function runCommand(options: FreeSwitchOptions, command: string): Promise<StringMap> {
	return runCallback(options, async (runCommand) => runCommand(command));
}
