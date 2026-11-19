import crypto from 'crypto';

import type { IRoom, IUser, VideoConference, IVideoConferenceUser } from '@rocket.chat/core-typings';
import { VideoConference as VideoConferenceModel } from '@rocket.chat/models';

import type { EventSinkRequest, SerializedServiceConfigurationRequest, ServiceConfiguration } from './definition';
import type { PexipSettings } from './definition/PexipSettings';
import { ServerConfigurationEndpoint } from './endpoints';
import { EventSinkEndpoint } from './endpoints/eventSink';
import { logger } from './logger';

export class Pexip {
	constructor(readonly settings: PexipSettings) {
		//
	}

	public validateRequestCredentials(authHeader?: string | null): void {
		const { api } = this.settings;

		if (!api.username) {
			return;
		}

		if (!authHeader?.startsWith('Basic ')) {
			throw new Error('Unauthorized');
		}

		const authorization = authHeader.replace('Basic ', '');

		const credentials = Buffer.from(authorization, 'base64').toString('ascii');
		const [username, password] = credentials.split(':');

		if (username !== api.username || password !== api.password) {
			throw new Error('Unauthorized');
		}
	}

	public getServiceConfiguration(serviceRequest: SerializedServiceConfigurationRequest): Promise<ServiceConfiguration | null> {
		const serviceConfiguration = new ServerConfigurationEndpoint(this);
		return serviceConfiguration.get(serviceRequest);
	}

	public async processEvent(event: EventSinkRequest): Promise<void> {
		try {
			logger.debug({ msg: 'Processing Event from Pexip Event Sink', event });
			const eventSink = new EventSinkEndpoint(this);
			await eventSink.post(event);
		} catch (err) {
			logger.error({ msg: 'Failed to process event sink notification', err });
		}
	}

	public async createAndStorePinsForCall(call: VideoConference): Promise<[string, string]> {
		if (call.providerData?.hostPin !== undefined && call.providerData.guestPin !== undefined) {
			return [call.providerData.hostPin, call.providerData.guestPin];
		}

		const [hostPin, guestPin] = await this.createPinsForCall(call);

		const providerData = { hostPin, guestPin, ...(call.providerData || {}) };
		await VideoConferenceModel.setProviderDataById(call._id, providerData);

		return [hostPin, guestPin];
	}

	public async createPinsForCall(call: VideoConference | undefined, room?: IRoom, user?: IUser): Promise<[string, string]> {
		// If we have pins saved in the call data, reuse them.
		if (call?.providerData?.hostPin !== undefined && call.providerData.guestPin !== undefined) {
			return [call.providerData.hostPin, call.providerData.guestPin];
		}

		const hostPin = await this.createHostPin(call, room, user);
		const guestPin = this.createGuestPin(call);

		return [hostPin, guestPin];
	}

	public async isUserCallHost(call: VideoConference, user?: IVideoConferenceUser): Promise<boolean> {
		if (!user) {
			return false;
		}

		return user._id === call.createdBy._id;
	}

	public getPinFromString(identifier: string): string {
		const hash = crypto.createHash('sha256').update(identifier).digest('hex');
		return this.getPinFromHash(hash);
	}

	public async createHostPin(call: VideoConference | undefined, room: IRoom | undefined, user: IUser | undefined): Promise<string> {
		const { pins } = this.settings;

		if (pins.host) {
			return pins.host;
		}

		// TODO: secure pins

		if (call) {
			return this.getPinFromString(`${call._id}${call.createdBy._id}`);
		}

		if (room) {
			return this.getPinFromString(`${room._id}_hosts`);
		}

		if (user) {
			return this.getPinFromString(`${user._id}_host`);
		}

		return '';
	}

	public createGuestPin(call: VideoConference | undefined): string {
		const { pins } = this.settings;

		if (pins.guest) {
			return pins.guest;
		}

		if (call) {
			return this.getPinFromString(`${call._id}${call.rid}`);
		}

		return '';
	}

	public getPinFromHash(hash: string): string {
		return String(BigInt(`0x${hash}`)).slice(-6);
	}
}
