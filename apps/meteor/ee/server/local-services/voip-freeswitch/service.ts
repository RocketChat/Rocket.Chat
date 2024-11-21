import { type IVoipFreeSwitchService, ServiceClassInternal, VideoConf } from '@rocket.chat/core-services';
import {
	VideoConferenceStatus,
	type FreeSwitchExtension,
	type IFreeSwitchChannel,
	type IFreeSwitchChannelUser,
	type IUser,
	type IVideoConference,
	type IVideoConferenceUser,
	type IVoIPVideoConference,
} from '@rocket.chat/core-typings';
import { getDomain, getUserPassword, getExtensionList, getExtensionDetails, listenToEvents } from '@rocket.chat/freeswitch';
import type { InsertionModel } from '@rocket.chat/model-typings';
import { FreeSwitchChannel, Rooms, Users } from '@rocket.chat/models';

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
		const allIds = await this.registerChannelEvent(uniqueId, eventName, filteredData);
		if (allIds.length > 1) {
			await FreeSwitchChannel.linkUniqueIds(allIds);
		}

		if (eventName !== 'CHANNEL_DESTROY') {
			return;
		}

		const allChannels = await FreeSwitchChannel.findAllByUniqueIds(allIds).toArray();
		// Do not log the call unless at least one of the channels got created
		if (!allChannels.some((channel) => Boolean(channel.createdAt))) {
			return;
		}
		// Do not log the call until all channels have been destroyed
		if (allChannels.some((channel) => !channel.destroyed)) {
			return;
		}

		return this.logCallOnVideoConf(allChannels);
	}

	private async buildCallData(channels: IFreeSwitchChannel[]): Promise<InsertionModel<IVoIPVideoConference>> {
		const allData = this.mergeAllEventData(channels);

		const caller = await this.getCallerFromEvents(allData);
		const callee = await this.getCalleeFromEvents(allData);

		const users = [caller.user, callee.user].filter((user) => user) as Required<IFreeSwitchChannelUser>['user'][];
		const createdBy: IVideoConference['createdBy'] = caller?.user
			? { _id: caller.user._id, name: caller.user.name, username: caller.user.username }
			: { _id: 'rocket.cat', username: 'rocket.cat', name: 'rocket.cat' };

		const rooms = users.length === 2 ? await Rooms.findDMsByUids(users.map(({ _id }) => _id)).toArray() : [];
		const rid = rooms.shift()?._id || 'invalid-rid';

		const data: Omit<InsertionModel<IVoIPVideoConference>, 'createdAt'> & { createdAt?: Date } = {
			type: 'voip',
			rid,
			users: users.map((user) => ({ ...user, ts: new Date() }) as IVideoConferenceUser),
			status: VideoConferenceStatus.ENDED,
			messages: {},
			providerName: 'chat.rocket.voip',
			createdBy,
			events: {},

			callerExtension: caller?.extension,
			calleeExtension: callee?.extension,
		};

		for (const channel of channels) {
			if (channel.createdAt && (!data.createdAt || data.createdAt > channel.createdAt)) {
				data.createdAt = channel.createdAt;
			}
			if (channel.endedAt && (!data.endedAt || data.endedAt < channel.endedAt)) {
				data.endedAt = channel.endedAt;
			}
			if (channel.duration && (!data.duration || data.duration < channel.duration)) {
				data.duration = channel.duration;
			}

			if (channel.outgoing) {
				data.events.outgoing = true;
				data.external = true;
			}
			if (channel.placedOnHold) {
				data.events.hold = true;
			}
			if (channel.parked) {
				data.events.park = true;
			}
			if (channel.bridged) {
				data.events.bridge = true;
			}
			if (channel.answered) {
				data.events.answer = true;
			}
		}

		return {
			createdAt: new Date(),
			...data,
		};
	}

	private async logCallOnVideoConf(channels: IFreeSwitchChannel[]): Promise<void> {
		const videoConfCall = await this.buildCallData(channels);
		const callId = await VideoConf.createVoIP(videoConfCall);

		await FreeSwitchChannel.setCallIdByIds(
			channels.map(({ _id }) => _id),
			callId,
		);
	}

	private async getChannelDataFromEvents(eventName: string, eventData: Record<string, string>): Promise<Partial<IFreeSwitchChannel>> {
		const lastEventName = eventName === 'CHANNEL_STATE' ? `CHANNEL_STATE=${eventData['Channel-State'] ?? 'none'}` : eventName;
		const channelState = eventData['Channel-State'];
		const answerState = eventData['Answer-State'];
		const hangupCause = eventData['Hangup-Cause'];
		const direction = eventData['Call-Direction'];

		const otherLegUniqueId = eventData['Other-Leg-Unique-ID'];
		const loopbackLegUniqueId = eventData.variable_other_loopback_leg_uuid;
		const loopbackFromUniqueId = eventData.variable_other_loopback_from_uuid;
		const oldUniqueId = eventData['Old-Unique-ID'];

		const referencedIds = [otherLegUniqueId, loopbackLegUniqueId, loopbackFromUniqueId, oldUniqueId].filter((id) => Boolean(id));

		const durationStr = eventData.variable_duration;
		const duration = (durationStr && parseInt(durationStr)) || 0;

		const channel: Partial<IFreeSwitchChannel> = {
			lastEventName,
			...(channelState && { channelState }),
			...(answerState && { answerState }),
			...(hangupCause && { hangupCause }),
			...(duration && { duration }),
			...(direction && { direction }),
			...(referencedIds.length && { referencedIds }),
			...(eventName === 'CHANNEL_DESTROY' && { destroyed: true, endedAt: new Date() }),
			...(eventName === 'CHANNEL_CREATE' && { createdAt: new Date() }),
			...(eventName === 'CHANNEL_OUTGOING' && { outgoing: true }),
			...(eventName === 'CHANNEL_HOLD' && { placedOnHold: true }),
			...(eventName === 'CHANNEL_PARK' && { parked: true }),
			...(eventName === 'CHANNEL_BRIDGE' && { bridged: true }),
			...(eventName === 'CHANNEL_ANSWER' && { answered: true }),
		};

		return channel;
	}

	private mergeAllEventData(channels: IFreeSwitchChannel[]): Record<string, string[]> {
		const allData: Record<string, string[]> = {};

		for (const channel of channels) {
			for (const { data } of channel.events) {
				for (const key in data) {
					if (!Object.hasOwnProperty.call(data, key)) {
						continue;
					}

					if (!allData[key]) {
						allData[key] = [];
					}

					if (allData[key].includes(data[key])) {
						continue;
					}

					allData[key].push(data[key]);
				}
			}
		}

		return allData;
	}

	private async getUserFromEvents(
		eventData: Record<string, string[]>,
		eventKeys: string[],
		contextKey?: string,
	): Promise<IFreeSwitchChannelUser> {
		const identifiers: string[] = [];
		let extension: string | undefined;

		for await (const key of eventKeys) {
			for await (const value of eventData[key]) {
				if (!value || value === '0' || identifiers.includes(value)) {
					continue;
				}

				identifiers.push(value);
				const strippedValue = value.replace(/\@.*/, '');
				if (!strippedValue) {
					continue;
				}

				if (!extension) {
					extension = strippedValue;
				}

				const user = await Users.findOneByFreeSwitchExtension<Pick<Required<IUser>, '_id' | 'username' | 'name' | 'avatarETag'>>(
					strippedValue,
					{ projection: { _id: 1, name: 1, username: 1, avatarETag: 1 } },
				);
				if (!user) {
					continue;
				}

				return {
					user,
					extension: strippedValue,
					...(contextKey && { context: eventData[contextKey]?.[0] }),
					identifiers,
				};
			}
		}

		return {
			extension,
			identifiers,
		};
	}

	private async getCallerFromEvents(eventData: Record<string, string[]>): Promise<IFreeSwitchChannelUser> {
		return this.getUserFromEvents(
			eventData,
			['variable_sip_from_user_stripped', 'variable_sip_from_user', 'Caller-Caller-ID-Number'],
			'variable_user_context',
		);
	}

	private async getCalleeFromEvents(eventData: Record<string, string[]>): Promise<IFreeSwitchChannelUser> {
		return this.getUserFromEvents(eventData, [
			'variable_sip_req_user',
			'variable_sip_to_user',
			'variable_dialed_extension',
			'variable_dialed_user',
			'variable_sip_to_uri',
		]);
	}

	private async registerChannelEvent(uniqueId: string, eventName: string, eventData: Record<string, string>): Promise<string[]> {
		const channelData = await this.getChannelDataFromEvents(eventName, eventData);

		const state = eventData['Channel-State'];

		const event = { eventName, state, data: eventData };
		await FreeSwitchChannel.registerEvent(uniqueId, event, channelData);

		return [uniqueId, ...(channelData.referencedIds ? channelData.referencedIds : [])];
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
