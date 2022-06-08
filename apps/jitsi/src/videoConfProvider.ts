import type { IVideoConferenceUser } from "@rocket.chat/apps-engine/definition/videoConferences";
import type { IVideoConfProvider, IVideoConferenceOptions, VideoConfData, VideoConfDataExtended } from "@rocket.chat/apps-engine/definition/videoConfProviders";

export class JitsiProvider implements IVideoConfProvider {
	public domain: string = 'meet.jit.si';

	public titlePrefix: string = 'RocketChat';

	public titleSuffix: string = '';

	public idType: 'id' | 'call' | 'title' = 'call';

	public ssl: boolean = true;

	public chromeExtensionId: string = '';

	public name = 'Jitsi';

	private getRoomName(call: VideoConfData): string {
		const name = call.title || call.rid;

		return `${this.titlePrefix}${name}${this.titleSuffix}`;
	}

	private getRoomIdentification(call: VideoConfData): string {
		switch (this.idType) {
			case 'id':
				return call.rid;
			case 'title':
				return this.getRoomName(call);
			default:
				return call._id;
		}
	}

	public async generateUrl(call: VideoConfData): Promise<string> {
		// return `https://jitsi.rocket.chat/${call._id}`;
		const protocol = this.ssl ? 'https' : 'http';

		const name = this.getRoomIdentification(call);

		return `${protocol}://${this.domain}/${name}`;
	}

	public async customizeUrl(call: VideoConfDataExtended, user: IVideoConferenceUser, options: IVideoConferenceOptions): Promise<string> {
		const configs = [`config.prejoinPageEnabled=false`, `config.requireDisplayName=false`];

		if (this.chromeExtensionId) {
			configs.push(`config.desktopSharingChromeExtId="${this.chromeExtensionId}"`);
		}

		if (user) {
			configs.push(`userInfo.displayName="${user.name}"`);
		}

		if (call.type === 'videoconference') {
			configs.push(`config.callDisplayName="${call.title || 'Video Conference'}"`);
		} else {
			configs.push(`config.callDisplayName="Direct Message"`);
		}

		if (options.mic !== undefined) {
			configs.push(`config.startWithAudioMuted=${options.mic ? 'false' : 'true'}`);
		}
		if (options.cam !== undefined) {
			configs.push(`config.startWithVideoMuted=${options.cam ? 'false' : 'true'}`);
		}

		const configHash = configs.join('&');
		const url = `${call.url}#${configHash}`;

		return url;
	}
}
