import { type IVoipFreeSwitchService, ServiceClassInternal } from '@rocket.chat/core-services';
import type { FreeSwitchExtension } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import { wrapExceptions } from '@rocket.chat/tools';

import { FreeSwitchRCClient } from './lib/client';

const FREESWITCH_HOST = process.env.FREESWITCHIP ?? '';
const FREESWITCH_PORT = 8021;
const FREESWITCH_PASSWORD = 'ClueCon';
const FREESWITCH_TIMEOUT = 3000;

export class VoipFreeSwitchService extends ServiceClassInternal implements IVoipFreeSwitchService {
	protected name = 'voip-freeswitch';

	private logger: Logger;

	constructor() {
		super();

		this.logger = new Logger('VoIPFreeSwitchService');
	}

	private async runCommand(command: string): Promise<Record<string, string | undefined>> {
		const client = new FreeSwitchRCClient({
			host: FREESWITCH_HOST,
			port: FREESWITCH_PORT,
			password: FREESWITCH_PASSWORD,
			logger: this.logger,
		});

		try {
			const call = await client.connect();

			const response = await call.bgapi(command, FREESWITCH_TIMEOUT);
			if (!response?.body) {
				throw new Error('No response from FreeSwitch server.');
			}

			return response.body;
		} finally {
			await wrapExceptions(async () => client.end()).suppress();
		}
	}

	private async parseUserList(commandResponse: Record<string, string | undefined>): Promise<Record<string, string>[]> {
		const { _body: text } = commandResponse;

		if (!text) {
			throw new Error('Invalid response from FreeSwitch server.');
		}

		const lines = text.split('\n');
		const columnsLine = lines.shift();
		if (!columnsLine) {
			throw new Error('Invalid resonse from FreeSwitch server.');
		}

		const columns = columnsLine.split('|');

		const items: (Record<string, string> | undefined)[] = lines.map((line) => {
			const values = line.split('|');
			if (!values.length || !values[0]) {
				return undefined;
			}
			return Object.fromEntries(
				values.map((value, index) => {
					return [(columns.length > index && columns[index]) || `column${index}`, value];
				}),
			);
		});

		return items.filter((user) => user?.userid && user.userid !== '+OK') as Record<string, string>[];
	}

	private parseUserStatus(status: string | undefined): FreeSwitchExtension['status'] {
		if (!status) {
			return 'UNKNOWN';
		}

		if (status === 'error/user_not_registered') {
			return 'UNREGISTERED';
		}

		if (status.startsWith('sofia/')) {
			return 'REGISTERED';
		}

		return 'UNKNOWN';
	}

	private mapUserData(user: Record<string, string | undefined>): FreeSwitchExtension {
		const {
			userid: extension,
			context,
			domain,
			group,
			contact,
			callgroup: callGroup,
			effective_caller_id_name: callerName,
			effective_caller_id_number: callerNumber,
		} = user;

		if (!extension) {
			throw new Error('Invalid user identification.');
		}

		return {
			extension,
			context,
			domain,
			group,
			status: this.parseUserStatus(contact),
			contact,
			callGroup,
			callerName,
			callerNumber,
		};
	}

	async getExtensionList(): Promise<FreeSwitchExtension[]> {
		const response = await this.runCommand('list_users');
		const users = await this.parseUserList(response);

		return users.map((item) => this.mapUserData(item));
	}

	async getExtensionDetails(requestParams: { extension: string; group?: string }): Promise<FreeSwitchExtension> {
		const { extension, group = 'default' } = requestParams;
		const response = await this.runCommand(`list_users group ${group} user ${extension}`);

		const users = await this.parseUserList(response);

		if (!users.length) {
			throw new Error('User not found.');
		}

		if (users.length >= 2) {
			throw new Error('Multiple users returned.');
		}

		return this.mapUserData(users[0]);
	}
}
