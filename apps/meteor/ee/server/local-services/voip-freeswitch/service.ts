import { type IVoipFreeSwitchService, ServiceClassInternal } from '@rocket.chat/core-services';
import type { FreeSwitchExtension } from '@rocket.chat/core-typings';
import { getDomain, getUserPassword, getExtensionList, getExtensionDetails } from '@rocket.chat/freeswitch';

import { settings } from '../../../../app/settings/server';

export class VoipFreeSwitchService extends ServiceClassInternal implements IVoipFreeSwitchService {
	protected name = 'voip-freeswitch';

	constructor() {
		super();
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

	async getDomain(): Promise<string> {
		const options = this.getConnectionSettings();
		return getDomain(options);
	}

	async getUserPassword(user: string): Promise<string> {
		const options = this.getConnectionSettings();
		return getUserPassword(options, user);
	}

	async getExtensionList(): Promise<FreeSwitchExtension[]> {
		const options = this.getConnectionSettings();
		return getExtensionList(options);
	}

	async getExtensionDetails(requestParams: { extension: string; group?: string }): Promise<FreeSwitchExtension> {
		const options = this.getConnectionSettings();
		return getExtensionDetails(options, requestParams);
	}
}
