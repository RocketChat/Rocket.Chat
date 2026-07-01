import type { IBlock } from '@rocket.chat/apps-engine/definition/uikit';
import type { VideoConferenceJoinOptions } from '@rocket.chat/core-services';
import type { VideoConference, IVideoConferenceUser, RequiredField } from '@rocket.chat/core-typings';
import { MediaCalls } from '@rocket.chat/models';

import type { Pexip } from './Pexip';
import { logger } from './logger';

export class PexipVideoConfProvider {
	public readonly name = 'Pexip';

	public readonly capabilities = {
		mic: false,
		cam: false,
		title: true,
		persistentChat: true,
	};

	constructor(public readonly pexip: Pexip) {
		//
	}

	public async isFullyConfigured(): Promise<boolean> {
		const { baseUrl, pins } = this.pexip.settings;

		if (!baseUrl) {
			return false;
		}

		// If both host and guest pins are set to the same value, it's an invalid configuration
		if (pins.host && pins.host === pins.guest) {
			return false;
		}

		return true;
	}

	public async generateUrl(call: VideoConference): Promise<string> {
		const { baseUrl, meetingUrl } = this.pexip.settings;

		if (!baseUrl) {
			throw new Error('Pexip URL is not configured');
		}

		const relativeUrl = meetingUrl.replace('{callId}', call._id);

		return `${baseUrl}${relativeUrl}`;
	}

	public async customizeUrl(
		call: RequiredField<VideoConference, 'url'>,
		user: IVideoConferenceUser | undefined,
		options?: VideoConferenceJoinOptions,
	): Promise<string> {
		logger.debug({ msg: 'Pexip.customizeUrl', options });

		const pin = await this.getPinForUser(call, user);
		const escalationParams = this.getEscalationParams();

		const { url: userUrl } = call;

		const url = new URL(userUrl);
		if (user) {
			const { _id: uid, name } = user;

			if (escalationParams?.size && (await this.isEscalatedUser(call, uid))) {
				for (const [key, value] of escalationParams) {
					url.searchParams.set(key, value);
				}
			}

			if (name) {
				url.searchParams.set('name', name);
			}
		}

		if (options?.mic === false) {
			url.searchParams.set('muteMicrophone', 'true');
		}

		if (options?.cam === false) {
			url.searchParams.set('muteCamera', 'true');
		}

		url.searchParams.set('pin', pin);
		return url.toString();
	}

	private getEscalationParams(): URLSearchParams | null {
		try {
			return new URLSearchParams(this.pexip.settings.escalationParams);
		} catch (err) {
			logger.error({ msg: 'Failed to parse Pexip Escalation Params', err });
			return null;
		}
	}

	private async isEscalatedUser(conference: VideoConference, uid: string): Promise<boolean> {
		const { mediaCallIds } = conference;

		if (!mediaCallIds?.length) {
			return false;
		}

		return MediaCalls.isUserInCallIds(uid, mediaCallIds);
	}

	public async onNewVideoConference(call: VideoConference): Promise<void> {
		// Generate pins for this call and keep them stored in the providerData.
		await this.pexip.createAndStorePinsForCall(call);
	}

	public async getVideoConferenceInfo(call: VideoConference, user: IVideoConferenceUser | undefined): Promise<Array<IBlock>> {
		const lines: Array<string> = [];

		// Show the in-product conference address (the `/conference/:id` page) rather than the raw Pexip
		// URL, so sharing it opens the internal conference experience.
		const siteUrl = this.pexip.settings.workspace.siteUrl.replace(/\/+$/, '');
		lines.push(`**URL:** ${siteUrl}/conference/${call._id}`);

		const [hostPin, guestPin] = await this.pexip.createPinsForCall(call);

		if (await this.pexip.isUserCallHost(call, user)) {
			lines.push(`**Host Pin:** ${hostPin}`);
		}

		lines.push(`**Guest Pin:** ${guestPin}`);

		return [
			{
				blockId: 'videoconf-info',
				type: 'section',
				text: {
					type: 'mrkdwn',
					text: lines.join('\n'),
				},
			} as IBlock,
		];
	}

	private async getPinForUser(call: VideoConference, user: IVideoConferenceUser | undefined): Promise<string> {
		const [hostPin, guestPin] = await this.pexip.createPinsForCall(call);

		if (await this.pexip.isUserCallHost(call, user)) {
			return hostPin;
		}

		return guestPin;
	}
}
