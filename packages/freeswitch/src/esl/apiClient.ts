import { FreeSwitchResponse, type FreeSwitchEventData, type StringMap } from 'esl';

import { logger } from '../logger';
import { FreeSwitchESLClient, type FreeSwitchESLClientOptions } from './client';

export class FreeSwitchApiClient extends FreeSwitchESLClient {
	private getCommandResponse(response: FreeSwitchEventData, command?: string): StringMap {
		if (!response?.body) {
			logger.error('No response from FreeSwitch server', command, response);
			throw new Error('No response from FreeSwitch server.');
		}

		return response.body;
	}

	protected async transitionToReady(): Promise<void> {
		try {
			this.response.event_json('BACKGROUND_JOB');
		} catch (error) {
			logger.error({ msg: 'Failed to request api responses', error });
			throw new Error('failed-to-request-api-responses');
		}

		super.transitionToReady();
	}

	public async runCommand(command: string, timeout?: number): Promise<StringMap> {
		await this.waitUntilUsable();

		const result = await this.response.bgapi(command, timeout ?? FreeSwitchResponse.default_command_timeout);
		return this.getCommandResponse(result, command);
	}

	public static async runCallback<T>(
		options: FreeSwitchESLClientOptions,
		cb: (runCommand: (command: string, timeout?: number) => Promise<StringMap>) => Promise<T>,
	): Promise<T> {
		const client = new FreeSwitchApiClient(options);
		try {
			await client.waitUntilUsable();
			// Await result so it runs within the try..finally scope
			const result = await cb(async (command: string, timeout?: number) => client.runCommand(command, timeout));

			return result;
		} finally {
			client.endConnection();
		}
	}

	public static async runSingleCommand(options: FreeSwitchESLClientOptions, command: string, timeout?: number): Promise<StringMap> {
		return this.runCallback(options, async (runCommand) => runCommand(command, timeout));
	}
}
