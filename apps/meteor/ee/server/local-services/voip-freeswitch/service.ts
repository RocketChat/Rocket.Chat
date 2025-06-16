import { type IVoipFreeSwitchService, ServiceClassInternal, ServiceStarter } from '@rocket.chat/core-services';
import type {
	DeepPartial,
	IFreeSwitchEventCall,
	IFreeSwitchEventCaller,
	IFreeSwitchEvent,
	FreeSwitchExtension,
	IFreeSwitchCall,
	IFreeSwitchCallEventType,
	IFreeSwitchCallEvent,
	AtLeast,
} from '@rocket.chat/core-typings';
import { isKnownFreeSwitchEventType } from '@rocket.chat/core-typings';
import { getDomain, getUserPassword, getExtensionList, getExtensionDetails, listenToEvents } from '@rocket.chat/freeswitch';
import type { InsertionModel } from '@rocket.chat/model-typings';
import { FreeSwitchCall, FreeSwitchEvent, Users } from '@rocket.chat/models';
import { objectMap, wrapExceptions } from '@rocket.chat/tools';
import type { WithoutId } from 'mongodb';
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
		const uniqueId = data['Unique-ID'];
		if (!uniqueId) {
			return;
		}

		// Using a set to avoid duplicates
		const callIds = new Set<string>(
			[data['Channel-Call-UUID'], data.variable_call_uuid].filter((callId) => Boolean(callId) && callId !== '0') as string[],
		);
		const event = await this.parseEventData(eventName, data);

		// If for some reason the event had different callIds, save a copy of it for each of them
		if (callIds.size > 1) {
			await Promise.all(
				callIds.values().map((callId) =>
					this.registerEvent({
						...event,
						call: {
							...event.call,
							UUID: callId,
						},
					}),
				),
			);
			return;
		}

		await this.registerEvent(event);
	}

	private getDetailedEventName(eventName: string, eventData: Record<string, string>): string {
		if (eventName === 'CHANNEL_STATE') {
			return `CHANNEL_STATE=${eventData['Channel-State']}`;
		}

		if (eventName === 'CHANNEL_CALLSTATE') {
			return `CHANNEL_CALLSTATE=${eventData['Channel-Call-State']}`;
		}

		return eventName;
	}

	private filterOutMissingData<T extends Record<string, any>>(data: T): DeepPartial<T> {
		return objectMap(
			data,
			({ key, value }) => {
				if (!value || value === '0') {
					return;
				}

				if (typeof value === 'object' && !Object.keys(value).length) {
					return;
				}

				return { key, value };
			},
			true,
		) as DeepPartial<T>;
	}

	private async parseEventData(
		eventName: string,
		eventData: Record<string, string | undefined>,
	): Promise<InsertionModel<WithoutId<IFreeSwitchEvent>>> {
		const filteredData: Record<string, string> = Object.fromEntries(
			Object.entries(eventData).filter(([_, value]) => value !== undefined),
		) as Record<string, string>;

		const detaildEventName = this.getDetailedEventName(eventName, filteredData);
		const state = eventData['Channel-State'];
		const sequence = eventData['Event-Sequence'];
		const previousCallState = eventData['Original-Channel-Call-State'];
		const callState = eventData['Channel-Call-State'];
		const answerState = eventData['Answer-State'];
		const hangupCause = eventData['Hangup-Cause'];
		const direction = eventData['Call-Direction'];
		const channelName = eventData['Channel-Name'];

		const otherLegUniqueId = eventData['Other-Leg-Unique-ID'];
		const loopbackLegUniqueId = eventData.variable_other_loopback_leg_uuid;
		const loopbackFromUniqueId = eventData.variable_other_loopback_from_uuid;
		const oldUniqueId = eventData['Old-Unique-ID'];

		const channelUniqueId = eventData['Unique-ID'];
		const referencedIds = [otherLegUniqueId, loopbackLegUniqueId, loopbackFromUniqueId, oldUniqueId].filter((id) =>
			Boolean(id),
		) as string[];
		const timestamp = eventData['Event-Date-Timestamp'];
		const firedAt = this.parseTimestamp(eventData['Event-Date-Timestamp']);

		const durationStr = eventData.variable_duration;
		const duration = (durationStr && parseInt(durationStr)) || 0;

		const call: Partial<IFreeSwitchEventCall> = {
			UUID: (eventData['Channel-Call-UUID'] !== '0' && eventData['Channel-Call-UUID']) || eventData.variable_call_uuid,
			answerState,
			state: callState,
			previousState: previousCallState,
			presenceId: eventData['Channel-Presence-ID'],
			sipId: eventData.variable_sip_call_id,
			authorized: eventData.variable_sip_authorized,
			hangupCause,
			duration,

			from: {
				user: eventData.variable_sip_from_user,
				stripped: eventData.variable_sip_from_user_stripped,
				port: eventData.variable_sip_from_port,
				uri: eventData.variable_sip_from_uri,
				host: eventData.variable_sip_from_host,
				full: eventData.variable_sip_full_from,
			},

			req: {
				user: eventData.variable_sip_req_user,
				port: eventData.variable_sip_req_port,
				uri: eventData.variable_sip_req_uri,
				host: eventData.variable_sip_req_host,
			},

			to: {
				user: eventData.variable_sip_to_user,
				port: eventData.variable_sip_to_port,
				uri: eventData.variable_sip_to_uri,
				full: eventData.variable_sip_full_to,
				dialedExtension: eventData.variable_dialed_extension,
				dialedUser: eventData.variable_dialed_user,
			},

			contact: {
				user: eventData.variable_sip_contact_user,
				uri: eventData.variable_sip_contact_uri,
				host: eventData.variable_sip_contact_host,
			},

			via: {
				full: eventData.variable_sip_full_via,
				host: eventData.variable_sip_via_host,
				rport: eventData.variable_sip_via_rport,
			},
		};

		const caller: Partial<IFreeSwitchEventCaller> = {
			uniqueId: eventData['Caller-Unique-ID'],
			direction: eventData['Caller-Direction'],
			username: eventData['Caller-Username'],
			networkAddr: eventData['Caller-Network-Addr'],
			ani: eventData['Caller-ANI'],
			destinationNumber: eventData['Caller-Destination-Number'],
			source: eventData['Caller-Source'],
			context: eventData['Caller-Context'],
			name: eventData['Caller-Caller-ID-Name'],
			number: eventData['Caller-Caller-ID-Number'],
			originalCaller: {
				name: eventData['Caller-Orig-Caller-ID-Name'],
				number: eventData['Caller-Orig-Caller-ID-Number'],
			},
			privacy: {
				hideName: eventData['Caller-Privacy-Hide-Name'],
				hideNumber: eventData['Caller-Privacy-Hide-Number'],
			},
			channel: {
				name: eventData['Caller-Channel-Name'],
				createdTime: eventData['Caller-Channel-Created-Time'],
			},
		};

		return this.filterOutMissingData({
			channelUniqueId,
			eventName,
			detaildEventName,
			sequence,
			state,
			previousCallState,
			callState,
			timestamp,
			firedAt,
			answerState,
			hangupCause,
			referencedIds,
			receivedAt: new Date(),
			channelName,
			direction,
			caller,
			call,
			eventData: filteredData,
		}) as InsertionModel<WithoutId<IFreeSwitchEvent>>;
	}

	private parseTimestamp(timestamp: string | undefined): Date | undefined {
		if (!timestamp || timestamp === '0') {
			return undefined;
		}

		const value = parseInt(timestamp);
		if (Number.isNaN(value)) {
			return undefined;
		}

		const timeValue = Math.floor(value / 1000);
		return new Date(timeValue);
	}

	private async registerEvent(event: InsertionModel<WithoutId<IFreeSwitchEvent>>): Promise<void> {
		try {
			await FreeSwitchEvent.registerEvent(event);
			if (event.eventName === 'CHANNEL_DESTROY' && event.call?.UUID) {
				await this.computeCall(event.call?.UUID);
			}
		} catch (error) {
			// avoid logging that an event was duplicated from mongo
			if (error instanceof MongoError && error.code === 11000) {
				return;
			}

			throw error;
		}
	}

	private getEventType(event: IFreeSwitchEvent): IFreeSwitchCallEventType {
		const { eventName, state, callState } = event;

		const modifiedEventName = eventName.toUpperCase().replace('CHANNEL_', '').replace('_COMPLETE', '');

		if (isKnownFreeSwitchEventType(modifiedEventName)) {
			return modifiedEventName;
		}

		if (modifiedEventName === 'STATE') {
			if (!state) {
				return 'OTHER_STATE';
			}

			const modifiedState = state.toUpperCase().replace('CS_', '');
			if (isKnownFreeSwitchEventType(modifiedState)) {
				return modifiedState;
			}
		}

		if (modifiedEventName === 'CALLSTATE') {
			if (!callState) {
				return 'OTHER_CALL_STATE';
			}

			const modifiedCallState = callState.toUpperCase().replace('CS_', '');
			if (isKnownFreeSwitchEventType(modifiedCallState)) {
				return modifiedCallState;
			}
		}

		return 'OTHER';
	}

	private identifyCallerFromEvent(event: IFreeSwitchEvent): string {
		if (event.call?.from?.user) {
			return event.call.from.user;
		}

		if (event.caller?.username) {
			return event.caller.username;
		}

		if (event.caller?.number) {
			return event.caller.number;
		}

		if (event.caller?.ani) {
			return event.caller.ani;
		}

		return '';
	}

	private identifyCalleeFromEvent(event: IFreeSwitchEvent): string {
		if (event.call?.to?.dialedExtension) {
			return event.call.to.dialedExtension;
		}

		if (event.call?.to?.dialedUser) {
			return event.call.to.dialedUser;
		}

		return '';
	}

	private isImportantEvent(event: IFreeSwitchEvent): boolean {
		return Object.keys(event).some((key) => key.startsWith('variable_'));
	}

	private async computeCall(callUUID: string): Promise<void> {
		const allEvents = await FreeSwitchEvent.findAllByCallUUID(callUUID).toArray();
		const call: InsertionModel<IFreeSwitchCall> = {
			UUID: callUUID,
			channels: [],
			events: [],
		};

		// Sort events by both sequence and timestamp, but only when they are present
		const sortedEvents = allEvents.sort((event1: IFreeSwitchEvent, event2: IFreeSwitchEvent) => {
			if (event1.sequence && event2.sequence) {
				return event1.sequence.localeCompare(event2.sequence);
			}

			if (event1.firedAt && event2.firedAt) {
				return event1.firedAt.valueOf() - event2.firedAt.valueOf();
			}

			if (event1.sequence || event2.sequence) {
				return (event1.sequence || '').localeCompare(event2.sequence || '');
			}

			return (event1.firedAt?.valueOf() || 0) - (event2.firedAt?.valueOf() || 0);
		});

		const fromUser = new Set<string>();
		const toUser = new Set<string>();
		let isVoicemailCall = false;
		for (const event of sortedEvents) {
			if (event.channelUniqueId && !call.channels.includes(event.channelUniqueId)) {
				call.channels.push(event.channelUniqueId);
			}
			if (!call.startedAt || (event.firedAt && event.firedAt < call.startedAt)) {
				call.startedAt = event.firedAt;
			}

			const eventType = this.getEventType(event);
			fromUser.add(this.identifyCallerFromEvent(event));
			toUser.add(this.identifyCalleeFromEvent(event));

			// when a call enters the voicemail, we receive one/or many events with the channelName = loopback/voicemail-x
			// where X appears to be a letter
			isVoicemailCall = event.channelName?.includes('voicemail') || isVoicemailCall;

			const hasUsefulCallData = this.isImportantEvent(event);

			const callEvent = this.filterOutMissingData({
				type: eventType,
				caller: event.caller,
				...(hasUsefulCallData && { call: event.call }),

				otherType: event.eventData['Other-Type'],
				otherChannelId: event.eventData['Other-Leg-Unique-ID'],
			}) as AtLeast<IFreeSwitchCallEvent, 'type'>;

			if (call.events[call.events.length - 1]?.type === eventType) {
				const previousEvent = call.events.pop() as IFreeSwitchCallEvent;

				call.events.push({
					...previousEvent,
					...callEvent,
					caller: {
						...previousEvent.caller,
						...callEvent.caller,
					},
					...((previousEvent.call || callEvent.call) && {
						call: {
							...previousEvent.call,
							...callEvent.call,
							from: {
								...previousEvent.call?.from,
								...callEvent.call?.from,
							},
							req: {
								...previousEvent.call?.req,
								...callEvent.call?.req,
							},
							to: {
								...previousEvent.call?.to,
								...callEvent.call?.to,
							},
							contact: {
								...previousEvent.call?.contact,
								...callEvent.call?.contact,
							},
							via: {
								...previousEvent.call?.via,
								...callEvent.call?.via,
							},
						},
					}),
				});
				continue;
			}

			call.events.push({
				...callEvent,
				eventName: event.eventName,
				sequence: event.sequence,
				channelUniqueId: event.channelUniqueId,
				timestamp: event.timestamp,
				firedAt: event.firedAt,
			});
		}

		if (fromUser.size) {
			const callerIds = [...fromUser].filter((e) => !!e);
			const user = await Users.findOneByFreeSwitchExtensions(callerIds, {
				projection: { _id: 1, username: 1, name: 1, avatarETag: 1, freeSwitchExtension: 1 },
			});

			if (user) {
				call.from = {
					_id: user._id,
					username: user.username,
					name: user.name,
					avatarETag: user.avatarETag,
					freeSwitchExtension: user.freeSwitchExtension,
				};
			}
		}

		if (toUser.size) {
			const calleeIds = [...toUser].filter((e) => !!e);
			const user = await Users.findOneByFreeSwitchExtensions(calleeIds, {
				projection: { _id: 1, username: 1, name: 1, avatarETag: 1, freeSwitchExtension: 1 },
			});
			if (user) {
				call.to = {
					_id: user._id,
					username: user.username,
					name: user.name,
					avatarETag: user.avatarETag,
					freeSwitchExtension: user.freeSwitchExtension,
				};
			}
		}

		// A call has 2 channels at max
		// If it has 3 or more channels, it's a forwarded call
		if (call.channels.length >= 3) {
			const originalCalls = await FreeSwitchCall.findAllByChannelUniqueIds(call.channels, { projection: { events: 0 } }).toArray();
			if (originalCalls.length) {
				call.forwardedFrom = originalCalls;
			}
		}

		// Call originated from us but destination and destination is another user = internal
		if (call.from && call.to) {
			call.direction = 'internal';
		}

		// Call originated from us but destination is not on server = external outbound
		if (call.from && !call.to) {
			call.direction = 'external_outbound';
		}

		// Call originated from a user outside server but received by a user in our side = external inbound
		if (!call.from && call.to) {
			call.direction = 'external_inbound';
		}

		// Call ended up in voicemail of another user = voicemail
		if (isVoicemailCall) {
			call.voicemail = true;
		}

		call.duration = this.computeCallDuration(call);

		await FreeSwitchCall.registerCall(call);
	}

	private computeCallDuration(call: InsertionModel<IFreeSwitchCall>): number {
		if (!call.events.length) {
			return 0;
		}

		const channelAnswerEvent = call.events.find((e) => e.eventName === 'CHANNEL_ANSWER');
		if (!channelAnswerEvent?.timestamp) {
			return 0;
		}

		const answer = this.parseTimestamp(channelAnswerEvent.timestamp);
		if (!answer) {
			return 0;
		}

		const channelHangupEvent = call.events.find((e) => e.eventName === 'CHANNEL_HANGUP_COMPLETE');
		if (!channelHangupEvent?.timestamp) {
			// We dont have a hangup but we have an answer, assume hangup is === destroy time
			return new Date().getTime() - answer.getTime();
		}

		const hangup = this.parseTimestamp(channelHangupEvent.timestamp);
		if (!hangup) {
			return 0;
		}

		return hangup.getTime() - answer.getTime();
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
