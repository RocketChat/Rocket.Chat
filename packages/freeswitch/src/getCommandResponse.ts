import type { FreeSwitchEventData, StringMap } from 'esl';

import { logger } from './logger';

export async function getCommandResponse(response: FreeSwitchEventData, command?: string): Promise<StringMap> {
	if (!response?.body) {
		logger.error('No response from FreeSwitch server', command, response);
		throw new Error('No response from FreeSwitch server.');
	}

	return response.body;
}
