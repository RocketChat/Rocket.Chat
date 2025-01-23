import { type IVoipFreeSwitchService, ServiceClassInternal, ServiceStarter } from '@rocket.chat/core-services';
import type { IFreeSwitchEvent, FreeSwitchExtension, IFreeSwitchCall, IFreeSwitchEventCallUser, IUser } from '@rocket.chat/core-typings';
import {
	getDomain,
	getUserPassword,
	getExtensionList,
	getExtensionDetails,
	listenToEvents,
	computeCallFromParsedEvents,
	parseEventData,
} from '@rocket.chat/freeswitch';
import type { InsertionModel } from '@rocket.chat/model-typings';
import { FreeSwitchCall, FreeSwitchEvent, Users } from '@rocket.chat/models';
import { wrapExceptions } from '@rocket.chat/tools';
import type { WithoutId } from 'mongodb';
import { MongoError } from 'mongodb';

import { settings } from '../../../../app/settings/server';

export class VoipFreeSwitchService extends ServiceClassInternal implements IVoipFreeSwitchService {
	protected name = 'voip-freeswitch';

	private serviceStarter: ServiceStarter;

	constructor() {
		super();

		this.serviceStarter = new ServiceStarter(() => Promise.resolve(this.startEvents()));
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

	private startEvents(): void {
		if (this.listening) {
			return;
		}

		try {
			// #ToDo: Reconnection
			// #ToDo: Only connect from one rocket.chat instance
			void listenToEvents(
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
		const event = await parseEventData(eventName, data);
		if (!event) {
			return;
		}

		// Using a set to avoid duplicates
		const callIds = new Set<string>(
			[data['Channel-Call-UUID'], data.variable_call_uuid].filter((callId) => Boolean(callId) && callId !== '0') as string[],
		);

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

			console.log(error);
			throw error;
		}
	}

	private async getUserDataForCall(user: IFreeSwitchEventCallUser): Promise<IUser | null> {
		const projection = { _id: 1, username: 1, name: 1, avatarETag: 1, freeSwitchExtension: 1 };

		if (user.uid) {
			return Users.findOneById(user.uid, { projection });
		}

		for await (const identifier of user.identifiers) {
			if (identifier.type !== 'extension' && identifier.type !== 'uid') {
				continue;
			}

			const user = await (identifier.type === 'uid'
				? Users.findOneById(identifier.value, { projection })
				: Users.findOneByFreeSwitchExtension(identifier.value, { projection }));

			if (user) {
				return user;
			}
		}

		return null;
	}

	private async computeCall(callUUID: string): Promise<void> {
		const allEvents = await FreeSwitchEvent.findAllByCallUUID(callUUID).toArray();
		const workspaceUrl = settings.get<string>('Site_Url');
		const call = await computeCallFromParsedEvents(callUUID, allEvents, workspaceUrl);

		if (!call) {
			return;
		}

		const { caller, callee, ...callData } = call;

		const fullCall: InsertionModel<IFreeSwitchCall> = {
			...callData,
		};

		if (caller?.workspaceUrl === workspaceUrl) {
			const user = await this.getUserDataForCall(caller);
			if (user) {
				fullCall.from = {
					_id: user._id,
					username: user.username,
					name: user.name,
					avatarETag: user.avatarETag,
					freeSwitchExtension: user.freeSwitchExtension,
				};
			}
		}

		if (callee && (callee.workspaceUrl === workspaceUrl || (caller?.workspaceUrl === workspaceUrl && call.direction === 'internal'))) {
			const user = await this.getUserDataForCall(callee);
			if (user) {
				fullCall.to = {
					_id: user._id,
					username: user.username,
					name: user.name,
					avatarETag: user.avatarETag,
					freeSwitchExtension: user.freeSwitchExtension,
				};
			}
		}

		// // A call has 2 channels at max
		// // If it has 3 or more channels, it's a forwarded call
		// if (call.channels.length >= 3) {
		// 	const originalCalls = await FreeSwitchCall.findAllByChannelUniqueIds(call.channels, { projection: { events: 0 } }).toArray();
		// 	if (originalCalls.length) {
		// 		call.forwardedFrom = originalCalls;
		// 	}
		// }
		await FreeSwitchCall.registerCall(fullCall);
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
