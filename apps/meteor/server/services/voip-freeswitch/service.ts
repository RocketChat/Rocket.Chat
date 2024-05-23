import { type IVoipFreeSwitchService, ServiceClassInternal } from '@rocket.chat/core-services';
import type { FreeSwitchExtension } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import { wrapExceptions } from '@rocket.chat/tools';

import { settings } from '../../../app/settings/server/cached';
import { FreeSwitchRCClient } from './lib/client';

export class VoipFreeSwitchService extends ServiceClassInternal implements IVoipFreeSwitchService {
	protected name = 'voip-freeswitch';

	private logger: Logger;

	constructor() {
		super();

		this.logger = new Logger('VoIPFreeSwitchService');
	}

	private getConnectionSettings(): { host: string; port: number; password: string; timeout: number } {
		if (!settings.get('VoIP_TeamCollab_Enabled') && !process.env.FREESWITCHIP) {
			throw new Error('VoIP is disabled.');
		}

		const host = process.env.FREESWITCHIP || settings.get<string>('VoIP_TeamCollab_FreeSwitch_Host');
		if (!host) {
			throw new Error('VoIP is not properly configured.');
		}

		const port = settings.get<number>('VoIP_TeamCollab_FreeSwitch_Port') || 8021;
		const timeout = settings.get<number>('VoIP_TeamCollab_FreeSwitch_Timeout') || 3000;
		const password = settings.get<string>('VoIP_TeamCollab_FreeSwitch_Password');

		return {
			host,
			port,
			password,
			timeout,
		};
	}

	private async runCommand(command: string): Promise<Record<string, string | undefined>> {
		const { host, port, password, timeout } = this.getConnectionSettings();

		const client = new FreeSwitchRCClient({
			host,
			port,
			password,
			logger: this.logger,
		});

		try {
			const call = await client.connect();

			const response = await call.bgapi(command, timeout);
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

		const users = new Map<string, Record<string, string | string[]>>();

		for (const line of lines) {
			const values = line.split('|');
			if (!values.length || !values[0]) {
				continue;
			}
			const user = Object.fromEntries(
				values.map((value, index) => {
					return [(columns.length > index && columns[index]) || `column${index}`, value];
				}),
			);

			if (!user.userid || user.userid === '+OK') {
				continue;
			}

			const { group, ...newUserData } = user;

			const existingUser = users.get(user.userid);
			const groups = (existingUser?.groups || []) as string[];

			if (group && !groups.includes(group)) {
				groups.push(group);
			}

			users.set(user.userid, {
				...(users.get(user.userid) || newUserData),
				groups,
			});
		}

		return [...users.values()].map((user) => ({
			...user,
			groups: (user.groups as string[]).join('|'),
		}));
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
			groups,
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
			groups: groups?.split('|') || [],
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
			throw new Error('Extension not found.');
		}

		if (users.length >= 2) {
			throw new Error('Multiple extensions were found.');
		}

		return this.mapUserData(users[0]);
	}
}
