import { IMediaStreamRenderer } from '@rocket.chat/core-typings';

import { hasLicense } from '../../../ee/app/license/client';
import { EEVoipClient } from '../../../ee/client/lib/voip/EEVoipClient';
import { VoIPUser } from './VoIPUser';

export class SimpleVoipUser {
	static async create(
		userName: string,
		password: string,
		registrar: string,
		webSocketPath: string,
		iceServers: Array<object>,
		voipRetryCount: number,
		enableKeepAliveForUnstableNetworks: boolean,
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
			connectionRetryCount: voipRetryCount,
			enableKeepAliveUsingOptionsForUnstableNetworks: enableKeepAliveForUnstableNetworks,
		};
		if (await hasLicense('livechat-enterprise')) {
			return EEVoipClient.create(config, mediaStreamRendered);
		}
		return VoIPUser.create(config, mediaStreamRendered);
	}
}
