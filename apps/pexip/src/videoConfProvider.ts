import type { IVideoConferenceUser } from "@rocket.chat/apps-engine/definition/videoConferences/IVideoConferenceUser";
import type { IVideoConfProvider, VideoConfData, VideoConfDataExtended, IVideoConferenceOptions } from "@rocket.chat/apps-engine/definition/videoConfProviders";

export class PexipProvider implements IVideoConfProvider {
	public baseUrl: string = '';

	public name = 'Pexip';

	public async generateUrl(call: VideoConfData): Promise<string> {
		if (!this.baseUrl) {
			throw new Error('Pexip URL is not configured');
		}

		return `${this.baseUrl}/webapp/conference?conference=${call._id}`;
	}

	public async customizeUrl(call: VideoConfDataExtended, user: IVideoConferenceUser, options: IVideoConferenceOptions): Promise<string> {
		// const sharedSecret = "pexiptest";
		const audioOnly = options.cam === false;
		const callType = audioOnly ? 'audio' : 'video';

		const { createHash } = require('crypto');
		const isHost = user && user._id === call.createdBy._id;
		const pinId = isHost ? call.createdBy._id : call.rid;

		const hash = createHash('sha256').update(`${call._id}${pinId}`).digest('hex');
		const pin = String(BigInt(`0x${hash}`)).slice(-6);

		const { url } = call;

		return `${url}&pin=${pin}&callType=${callType}`;
	}
}
