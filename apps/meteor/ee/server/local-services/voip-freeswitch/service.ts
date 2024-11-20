import { type IVoipFreeSwitchService, ServiceClassInternal } from '@rocket.chat/core-services';
import type { FreeSwitchExtension, IFreeSwitchChannel } from '@rocket.chat/core-typings';
import { getDomain, getUserPassword, getExtensionList, getExtensionDetails, listenToEvents } from '@rocket.chat/freeswitch';
import { FreeSwitchChannel } from '@rocket.chat/models';

import { settings } from '../../../../app/settings/server';

export class VoipFreeSwitchService extends ServiceClassInternal implements IVoipFreeSwitchService {
	protected name = 'voip-freeswitch';

	public async started(): Promise<void> {
		try {
			void listenToEvents((...args) => this.onFreeSwitchEvent(...args), this.getConnectionSettings());
		} catch (error) {
			console.error(error);
		}
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

	private async onFreeSwitchEvent(eventName: string, data: Record<string, string | undefined>): Promise<void> {
		const uniqueId = data['Unique-ID'];
		if (!uniqueId) {
			return;
		}
		const filteredData = Object.fromEntries(Object.entries(data).filter(([_, value]) => value !== undefined)) as Record<string, string>;

		await this.registerChannelEvent(uniqueId, eventName, filteredData);
	}

	private async registerChannelEvent(uniqueId: string, eventName: string, eventData: Record<string, string>): Promise<void> {
		const channelData: Partial<IFreeSwitchChannel> = {
			lastEventName: eventName === 'CHANNEL_STATE' ? `CHANNEL_STATE=${eventData['Channel-State']}` : eventName,
			...(eventData['Channel-State'] && { channelState: eventData['Channel-State'] }),
			...(eventData['Other-Leg-Unique-ID'] && { otherLegUniqueId: eventData['Other-Leg-Unique-ID'] }),
			...(eventData['Caller-Username'] && { 'caller.username': eventData['Caller-Username'] }),
			...(eventData['Caller-Context'] && { 'caller.context': eventData['Caller-Context'] }),
		};

		const event = { eventName, data: eventData };

		return FreeSwitchChannel.registerEvent(uniqueId, event, channelData);
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
