import { type IVoipFreeSwitchService, ServiceClassInternal, ServiceStarter } from '@rocket.chat/core-services';
import type {
	FreeSwitchExtension,
	IFreeSwitchChannelEvent,
	IFreeSwitchChannel,
	IFreeSwitchChannelEventDelta,
} from '@rocket.chat/core-typings';
import {
	getDomain,
	getUserPassword,
	getExtensionList,
	getExtensionDetails,
	listenToEvents,
	parseEventData,
	computeChannelFromEvents,
} from '@rocket.chat/freeswitch';
import type { InsertionModel } from '@rocket.chat/model-typings';
import { FreeSwitchChannel, FreeSwitchChannelEvent, FreeSwitchChannelEventDelta } from '@rocket.chat/models';
import { wrapExceptions } from '@rocket.chat/tools';
import type { InsertOneResult, WithoutId } from 'mongodb';
import { MongoError } from 'mongodb';

import { settings } from '../../../../app/settings/server';

export class VoipFreeSwitchService extends ServiceClassInternal implements IVoipFreeSwitchService {
	protected name = 'voip-freeswitch';

	private serviceStarter: ServiceStarter;

	constructor() {
		super();

		this.serviceStarter = new ServiceStarter(() => this.startEvents());
		this.onEvent('watch.settings', async ({ setting }): Promise<void> => {
			if (setting._id === 'VoIP_TeamCollab_Enabled' && setting.value === true) {
				void this.serviceStarter.start();
			}
		});
	}

	private listening = false;

	public async started(): Promise<void> {
		void this.serviceStarter.start();
	}

	private async startEvents(): Promise<void> {
		if (this.listening) {
			return;
		}

		try {
			// #ToDo: Reconnection
			// #ToDo: Only connect from one rocket.chat instance
			await listenToEvents(
				async (...args) => wrapExceptions(() => this.onFreeSwitchEvent(...args)).suppress(),
				this.getConnectionSettings(),
			);
			this.listening = true;
		} catch (_e) {
			this.listening = false;
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
		const event = parseEventData(eventName, data);
		if (!event) {
			return;
		}

		await this.registerEvent(event);
	}

	private async registerRecord(registerFn: () => Promise<void | InsertOneResult>): Promise<void> {
		try {
			await registerFn();
		} catch (error) {
			// avoid logging that an event was duplicated from mongo
			if (error instanceof MongoError && error.code === 11000) {
				return;
			}

			console.log(error);
			throw error;
		}
	}

	private async registerEvent(event: InsertionModel<WithoutId<IFreeSwitchChannelEvent>>): Promise<void> {
		return this.registerRecord(async () => {
			await FreeSwitchChannelEvent.registerEvent(event);

			// #TODO: Use Agenda, so we can cover cases where the CHANNEL_DESTROY event is lost
			if (event.eventName === 'CHANNEL_DESTROY' && event.channelUniqueId) {
				setTimeout(async () => {
					await this.computeChannel(event.channelUniqueId);
				}, 1000);
			}
		});
	}

	private async registerChannel(channel: InsertionModel<WithoutId<IFreeSwitchChannel>>): Promise<void> {
		return this.registerRecord(() => FreeSwitchChannel.registerChannel(channel));
	}

	private async registerChannelDelta(record: InsertionModel<WithoutId<IFreeSwitchChannelEventDelta>>): Promise<void> {
		return this.registerRecord(() => FreeSwitchChannelEventDelta.registerDelta(record));
	}

	private async computeChannel(channelUniqueId: string): Promise<void> {
		const allEvents = await FreeSwitchChannelEvent.findAllByChannelUniqueId(channelUniqueId).toArray();

		const result = await computeChannelFromEvents(allEvents);
		if (result?.channel) {
			const { channel, deltas, finalState } = result;

			await this.registerChannel(channel);
			await this.registerChannelDelta({ channelUniqueId: channel.uniqueId, isFinalState: true, finalState });

			await Promise.all(
				deltas.map(async (delta) => this.registerChannelDelta({ channelUniqueId: channel.uniqueId, isFinalState: false, event: delta })),
			);
		}
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
