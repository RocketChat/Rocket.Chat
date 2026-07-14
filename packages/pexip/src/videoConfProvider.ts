import type { IBlock } from '@rocket.chat/apps-engine/definition/uikit';
import type { VideoConferenceJoinOptions } from '@rocket.chat/core-services';
import type { VideoConference, AtLeast, IRoom, IVideoConferenceUser, RequiredField } from '@rocket.chat/core-typings';
import { Rooms } from '@rocket.chat/models';

import type { Pexip } from './Pexip';

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

		const meetingParams = {
			rid: call.discussionRid && (await this.getDiscussionUrl(call.discussionRid)),
		};

		const encodedParams = {
			...meetingParams,
			rid: meetingParams.rid && encodeURIComponent(meetingParams.rid),
		};

		return this.joinUrlAndParams(`${baseUrl}${relativeUrl}`, encodedParams);
	}

	private joinUrlParams(params: Record<string, string | undefined>): string {
		return Object.keys(params)
			.filter((key) => params[key] !== undefined && params[key] !== null)
			.map((key) => `${key}=${params[key]}`)
			.join('&');
	}

	private joinUrlAndParams(baseUrl: string, params: Record<string, string | undefined>): string {
		const joinedParams = this.joinUrlParams(params);
		return `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}${joinedParams}`;
	}

	private async getDiscussionUrl(rid: string): Promise<string | undefined> {
		const room = await Rooms.findOneById<Pick<IRoom, '_id' | 't' | 'name'>>(rid, { projection: { t: 1, name: 1 } });
		if (!room) {
			return;
		}

		const roomRoute = this.getDiscussionRoute(room);
		if (!roomRoute) {
			return;
		}

		const baseUrl = await this.getBaseURLWithoutTrailingSlash();
		const roomUrl = `${baseUrl}/${roomRoute}`;

		const roomParams = {
			layout: 'embedded',
		};

		const params = Object.keys(roomParams)
			.map((key) => `${key}=${roomParams[key as keyof typeof roomParams]}`)
			.join('&');

		return `${roomUrl}${roomUrl.includes('?') ? '&' : '?'}${params}`;
	}

	private getDiscussionRoute(room: AtLeast<IRoom, 't' | 'name'>): string | undefined {
		switch (room.t) {
			case 'c':
				return `channel/${room.name}`;
			case 'p':
				return `group/${room.name}`;
			default:
				return undefined;
		}
	}

	private async getBaseURLWithoutTrailingSlash(): Promise<string> {
		const url = this.pexip.settings.workspace.siteUrl;

		if (url.endsWith('/')) {
			return url.substr(0, url.length - 1);
		}
		return url;
	}

	/**
	 * The address this particular person should open, from the conference's own.
	 *
	 * Built through `URL` rather than by appending: the call's url is whatever the workspace's meeting-url
	 * setting produced, so whether it already carries a query is not ours to assume — and a display name is
	 * user input that has to be encoded rather than concatenated.
	 */
	public async customizeUrl(
		call: RequiredField<VideoConference, 'url'>,
		user: IVideoConferenceUser | undefined,
		options?: VideoConferenceJoinOptions,
	): Promise<string> {
		const pin = await this.getPinForUser(call, user);

		const url = new URL(call.url);

		if (user?.name) {
			url.searchParams.set('name', user.name);
		}

		// Only an explicit `false` mutes: the caller saying nothing about a device is not the same as the caller
		// asking for it to be off.
		if (options?.mic === false) {
			url.searchParams.set('muteMicrophone', 'true');
		}

		if (options?.cam === false) {
			url.searchParams.set('muteCamera', 'true');
		}

		url.searchParams.set('pin', pin);

		return url.toString();
	}

	public async onUserJoin(_call: VideoConference, _user?: IVideoConferenceUser): Promise<void> {
		// Nothing to do: Pexip learns about arrivals from its own event sink rather than from us.
	}

	public async onNewVideoConference(call: VideoConference): Promise<void> {
		// Generate pins for this call and keep them stored in the providerData.
		await this.pexip.createAndStorePinsForCall(call);
	}

	public async getVideoConferenceInfo(call: VideoConference, user: IVideoConferenceUser | undefined): Promise<Array<IBlock>> {
		const lines: Array<string> = [];

		lines.push(`**URL:** ${call.url}`);

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
