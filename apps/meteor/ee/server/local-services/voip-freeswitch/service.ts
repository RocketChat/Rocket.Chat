import { type IVoipFreeSwitchService, ServiceClassInternal } from '@rocket.chat/core-services';
import type { FreeSwitchExtension, ISetting, SettingValue } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import { wrapExceptions } from '@rocket.chat/tools';
import type { FreeSwitchEventData, StringMap } from 'esl';

import { FreeSwitchRCClient } from './lib/client';

export class VoipFreeSwitchService extends ServiceClassInternal implements IVoipFreeSwitchService {
	protected name = 'voip-freeswitch';

	private logger: Logger;

	constructor(private getSetting: <T extends SettingValue = SettingValue>(id: ISetting['_id']) => T) {
		super();

		this.logger = new Logger('VoIPFreeSwitchService');
	}

	private getConnectionSettings(): { host: string; port: number; password: string; timeout: number } {
		if (!this.getSetting('VoIP_TeamCollab_Enabled') && !process.env.FREESWITCHIP) {
			throw new Error('VoIP is disabled.');
		}

		const host = process.env.FREESWITCHIP || this.getSetting<string>('VoIP_TeamCollab_FreeSwitch_Host');
		if (!host) {
			throw new Error('VoIP is not properly configured.');
		}

		const port = this.getSetting<number>('VoIP_TeamCollab_FreeSwitch_Port') || 8021;
		const timeout = this.getSetting<number>('VoIP_TeamCollab_FreeSwitch_Timeout') || 3000;
		const password = this.getSetting<string>('VoIP_TeamCollab_FreeSwitch_Password');

		return {
			host,
			port,
			password,
			timeout,
		};
	}

	private async runCallback<T>(cb: (runCommand: (command: string) => Promise<StringMap>) => Promise<T>): Promise<T> {
		const { host, port, password, timeout } = this.getConnectionSettings();

		const client = new FreeSwitchRCClient({
			host,
			port,
			password,
			logger: this.logger,
		});

		try {
			const call = await client.connect();

			// Await result so it runs within the try..finally scope
			const result = await cb(async (command) => {
				const response = await call.bgapi(command, timeout);
				return this.getCommandResponse(response, command);
			});

			return result;
		} finally {
			await wrapExceptions(async () => client.end()).suppress();
		}
	}

	private async getCommandResponse(response: FreeSwitchEventData, command?: string): Promise<StringMap> {
		if (!response?.body) {
			this.logger.error('No response from FreeSwitch server', command, response);
			throw new Error('No response from FreeSwitch server.');
		}

		return response.body;
	}

	private async runCommand(command: string): Promise<StringMap> {
		return this.runCallback(async (runCommand) => runCommand(command));
	}

	private async parseUserList(commandResponse: StringMap): Promise<Record<string, string>[]> {
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

	private mapUserData(user: StringMap): FreeSwitchExtension {
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

	private parseDomainResponse(response: StringMap): string {
		const { _body: domain } = response;

		if (domain === undefined) {
			this.logger.error({ msg: 'Failed to load user domain', response });
			throw new Error('Failed to load user domain from FreeSwitch.');
		}

		return domain;
	}

	private parsePasswordResponse(response: StringMap): string {
		const { _body: password } = response;

		if (password === undefined) {
			this.logger.error({ msg: 'Failed to load user password', response });
			throw new Error('Failed to load user password from FreeSwitch.');
		}

		return password;
	}

	private getCommandGetDomain(): string {
		return 'eval ${domain}';
	}

	private getCommandListUsers(): string {
		return 'list_users';
	}

	private getCommandListFilteredUser(user: string, group = 'default'): string {
		return `list_users group ${group} user ${user}`;
	}

	private getCommandGetUserPassword(user: string, domain = 'rocket.chat'): string {
		return `user_data ${user}@${domain} param password`;
	}

	async getDomain(): Promise<string> {
		const response = await this.runCommand(this.getCommandGetDomain());
		return this.parseDomainResponse(response);
	}

	async getUserPassword(user: string): Promise<string> {
		return this.runCallback(async (runCommand) => {
			const domainResponse = await runCommand(this.getCommandGetDomain());
			const domain = this.parseDomainResponse(domainResponse);

			const response = await runCommand(this.getCommandGetUserPassword(user, domain));
			return this.parsePasswordResponse(response);
		});
	}

	async getExtensionList(): Promise<FreeSwitchExtension[]> {
		const response = await this.runCommand(this.getCommandListUsers());
		const users = await this.parseUserList(response);

		return users.map((item) => this.mapUserData(item));
	}

	async getExtensionDetails(requestParams: { extension: string; group?: string }): Promise<FreeSwitchExtension> {
		const { extension, group } = requestParams;
		const response = await this.runCommand(this.getCommandListFilteredUser(extension, group));

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
