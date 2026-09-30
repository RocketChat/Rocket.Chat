import { Authorization } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import { VideoConference as VideoConferenceModel } from '@rocket.chat/models';

import { getLiveKitConfig, isLiveKitFullyConfigured } from './config';
import { createLiveKitAccessToken } from './token';
import { settings } from '../../../../server/settings';

const logger = new Logger('VideoConference/CallConfig');

/** What a client needs to set a call up itself; the provider's own key is present only when it needs configuring. */
export type CallConfig = {
	providerName: string;
	livekit?: { serverUrl: string; token: string; roomName: string };
};

export type CallConfigError =
	'error-videoconf-invalid-call' | 'forbidden' | 'error-videoconf-livekit-not-configured' | 'error-videoconf-livekit-token-failed';

export type CallConfigResult = { config: CallConfig } | { error: CallConfigError };

const livekitRoomNameFor = (callId: string) => `mc-${callId}`;

const displayNameOf = (user: Pick<IUser, '_id' | 'name' | 'username'>): string =>
	(settings.get<boolean>('UI_Use_Real_Name') ? user.name : user.username) || user.username || user._id;

/** The configuration of a call for one of its members. */
export async function getCallConfig(callId: string, user: Pick<IUser, '_id' | 'name' | 'username'>): Promise<CallConfigResult> {
	const call = await VideoConferenceModel.findOneById(callId);
	// An ended call is refused before a token is minted, as joining one is.
	if (!call?.rid || call.endedAt) {
		return { error: 'error-videoconf-invalid-call' };
	}

	// Call membership is granted without room access, so the conference rule applies rather than the room's.
	if (!(await Authorization.canAccessConference(call, user._id))) {
		return { error: 'forbidden' };
	}

	if (call.providerName !== 'livekit') {
		return { config: { providerName: call.providerName } };
	}

	if (!isLiveKitFullyConfigured()) {
		return { error: 'error-videoconf-livekit-not-configured' };
	}

	const roomName = livekitRoomNameFor(callId);
	const token = await createLiveKitAccessToken({
		identity: user._id,
		name: displayNameOf(user),
		grant: { roomJoin: true, room: roomName, canPublish: true, canSubscribe: true, canPublishData: true },
	}).catch((err) => {
		logger.error({ msg: 'Failed to mint LiveKit access token', callId, err });
		return undefined;
	});

	if (!token) {
		return { error: 'error-videoconf-livekit-token-failed' };
	}

	return { config: { providerName: 'livekit', livekit: { serverUrl: getLiveKitConfig().url, token, roomName } } };
}
