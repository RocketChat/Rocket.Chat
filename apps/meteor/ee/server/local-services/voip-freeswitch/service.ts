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
	parseEventData,
	computeChannelFromEvents,
	logger,
	FreeSwitchEventClient,
	type EventData,
	type FreeSwitchOptions,
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

	private eventClient: FreeSwitchEventClient | null = null;

	private wasEverConnected = false;

	constructor() {
		super();

		this.serviceStarter = new ServiceStarter(
			async () => {
				// Delay start to ensure setting values are up-to-date in the cache
				setImmediate(() => this.startEvents());
			},
			async () => this.stopEvents(),
		);
		this.onEvent('watch.settings', async ({ setting }): Promise<void> => {
			if (setting._id === 'VoIP_TeamCollab_Enabled') {
				if (setting.value !== true) {
					void this.serviceStarter.stop();
					return;
				}

				if (setting.value === true) {
					void this.serviceStarter.start();
					return;
				}
			}

			if (setting._id === 'VoIP_TeamCollab_FreeSwitch_Host') {
				// Re-connect if the host changes
				if (this.eventClient && this.eventClient.host !== setting.value) {
					this.stopEvents();
				}

				if (setting.value) {
					void this.serviceStarter.start();
				}
			}

			// If any other freeswitch setting changes, only reconnect if it's not yet connected
			if (setting._id.startsWith('VoIP_TeamCollab_FreeSwitch_')) {
				if (!this.eventClient?.isReady()) {
					this.stopEvents();
					void this.serviceStarter.start();
				}
			}
		});
	}

	public async started(): Promise<void> {
		void this.serviceStarter.start();
	}

	private async startEvents(): Promise<void> {
		if (this.eventClient) {
			if (!this.eventClient.isDone()) {
				return;
			}

			const client = this.eventClient;
			this.eventClient = null;
			client.endConnection();
		}

		const options = wrapExceptions(() => this.getConnectionSettings()).suppress();
		if (!options) {
			this.wasEverConnected = false;
			return;
		}

		this.initializeEventClient(options);
	}

	private retryEventsLater(): void {
		// Try to re-establish connection after some time
		setTimeout(
			() => {
				void this.startEvents();
			},
			this.wasEverConnected ? 3000 : 20_000,
		);
	}

	private initializeEventClient(options: FreeSwitchOptions): void {
		const client = FreeSwitchEventClient.listenToEvents(options);
		this.eventClient = client;

		client.on('ready', () => {
			if (this.eventClient !== client) {
				return;
			}
			this.wasEverConnected = true;
		});

		client.on('end', () => {
			if (this.eventClient && this.eventClient !== client) {
				return;
			}

			this.eventClient = null;
			this.retryEventsLater();
		});

		client.on('event', async ({ eventName, eventData }) => {
			if (this.eventClient !== client) {
				return;
			}

			await wrapExceptions(() =>
				this.onFreeSwitchEvent(eventName as string, eventData as unknown as Record<string, string | undefined>),
			).suppress();
		});
	}

	private stopEvents(): void {
		if (!this.eventClient) {
			return;
		}

		this.eventClient.endConnection();
		this.wasEverConnected = false;
		this.eventClient = null;
	}

	private getConnectionSettings(): FreeSwitchOptions {
		if (!settings.get('VoIP_TeamCollab_Enabled')) {
			throw new Error('VoIP is disabled.');
		}

		const host = settings.get<string>('VoIP_TeamCollab_FreeSwitch_Host');
		if (!host) {
			throw new Error('VoIP is not properly configured.');
		}

		const port = settings.get<number>('VoIP_TeamCollab_FreeSwitch_Port') || 8021;
		const timeout = settings.get<number>('VoIP_TeamCollab_FreeSwitch_Timeout') || 3000;
		const password = settings.get<string>('VoIP_TeamCollab_FreeSwitch_Password');

		return {
			socketOptions: {
				host,
				port,
			},
			password,
			timeout,
		};
	}

	private async onFreeSwitchEvent(eventName: string, data: EventData): Promise<void> {
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

			logger.error(error);
			throw error;
		}
	}

	private async registerEvent(event: InsertionModel<WithoutId<IFreeSwitchChannelEvent>>): Promise<void> {
		const { channelUniqueId, eventName } = event;

		if (eventName === 'CHANNEL_DESTROY' && channelUniqueId) {
			// #TODO: Replace with a proper background process, also make it not rely on the CHANNEL_DESTROY event.
			setTimeout(() => {
				this.computeChannel(channelUniqueId).catch((reason) => {
					logger.error({ msg: 'Failed to compute channel data ', reason, channelUniqueId });
				});
			}, 2000);
		}

		return this.registerRecord(() => FreeSwitchChannelEvent.registerEvent(event));
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
			const { channel, deltas } = result;

			await this.registerChannel(channel);

			await Promise.allSettled(deltas.map(async (delta) => this.registerChannelDelta({ channelUniqueId: channel.uniqueId, ...delta })));
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
