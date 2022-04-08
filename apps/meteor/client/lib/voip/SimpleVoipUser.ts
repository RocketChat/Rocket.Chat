import { IMediaStreamRenderer } from '../../../definition/voip/VoIPUserConfiguration';
import { VoIPUser } from './VoIPUser';

export class SimpleVoipUser {
	static async create(
		userName: string,
		password: string,
		registrar: string,
		webSocketPath: string,
		iceServers: Array<object>,
		callType?: 'audio' | 'video',
		mediaStreamRendered?: IMediaStreamRenderer,
	): Promise<VoIPUser> {
		const config = {
			authUserName: userName,
			authPassword: password,
			sipRegistrarHostnameOrIP: registrar,
			webSocketURI: webSocketPath,

			enableVideo: callType === 'video',
			iceServers,
		};

		return VoIPUser.create(config, mediaStreamRendered);
	}
}
