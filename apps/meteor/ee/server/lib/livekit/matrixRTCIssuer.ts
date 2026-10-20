import type { IMatrixRTCLiveKitIssuer } from '@rocket.chat/federation-matrix';
import { MATRIXRTC_TOKEN_SERVICE_PATH } from '@rocket.chat/federation-matrix';

import { getLiveKitConfig, isLiveKitFullyConfigured } from './config';
import type { VideoGrant } from './token';
import { createLiveKitAccessToken } from './token';
import { settings } from '../../../../server/settings';

const grantFor = (roomName: string, canPublish: boolean, hidden = false): VideoGrant => ({
	roomJoin: true,
	room: roomName,
	canSubscribe: true,
	canPublish,
	canPublishData: canPublish,
	// MSC4195 recommends that watchers from other homeservers cannot rename themselves either.
	...(!canPublish && { canUpdateOwnMetadata: false }),
	...(hidden && { hidden: true }),
});

/** This server's LiveKit, as federated calls reach it: its SFU, its token service and the tokens for it. */
export const matrixRTCLiveKitIssuer: IMatrixRTCLiveKitIssuer = {
	getOwnTransport() {
		if (!isLiveKitFullyConfigured()) {
			return undefined;
		}

		const siteUrl = (settings.get<string>('Site_Url') || '').trim().replace(/\/+$/, '');

		return { url: getLiveKitConfig().url, serviceUrl: `${siteUrl}${MATRIXRTC_TOKEN_SERVICE_PATH}` };
	},

	mintToken({ roomName, identity, name, canPublish, hidden }) {
		return createLiveKitAccessToken({ identity, name, grant: grantFor(roomName, canPublish, hidden) });
	},
};
