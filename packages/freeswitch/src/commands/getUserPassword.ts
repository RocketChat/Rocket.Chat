import type { StringMap } from 'esl';

import type { FreeSwitchOptions } from '../FreeSwitchOptions';
import { logger } from '../logger';
import { runCallback } from '../runCommand';
import { getCommandGetDomain, parseDomainResponse } from './getDomain';

export function getCommandGetUserPassword(user: string, domain = 'rocket.chat'): string {
	return `user_data ${user}@${domain} param password`;
}

export function parsePasswordResponse(response: StringMap): string {
	const { _body: password } = response;

	if (password === undefined) {
		logger.error({ msg: 'Failed to load user password', response });
		throw new Error('Failed to load user password from FreeSwitch.');
	}

	return password;
}

export async function getUserPassword(options: FreeSwitchOptions, user: string): Promise<string> {
	return runCallback(options, async (runCommand) => {
		const domainResponse = await runCommand(getCommandGetDomain());
		const domain = parseDomainResponse(domainResponse);

		const response = await runCommand(getCommandGetUserPassword(user, domain));
		return parsePasswordResponse(response);
	});
}
