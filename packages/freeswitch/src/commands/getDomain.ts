import type { StringMap } from 'esl';

import type { FreeSwitchOptions } from '../FreeSwitchOptions';
import { FreeSwitchApiClient } from '../esl';
import { logger } from '../logger';

export function getCommandGetDomain(): string {
	return 'eval ${domain}';
}

export function parseDomainResponse(response: StringMap): string {
	const { _body: domain } = response;

	if (typeof domain !== 'string') {
		logger.error({ msg: 'Failed to load user domain', response });
		throw new Error('Failed to load user domain from FreeSwitch.');
	}

	return domain;
}

export async function getDomain(options: FreeSwitchOptions): Promise<string> {
	const response = await FreeSwitchApiClient.runSingleCommand(options, getCommandGetDomain());
	return parseDomainResponse(response);
}
