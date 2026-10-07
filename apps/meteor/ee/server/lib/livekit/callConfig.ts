import { Authorization, FederationMatrix } from '@rocket.chat/core-services';
import type { IUser, IVideoConference, VideoConferenceFederation } from '@rocket.chat/core-typings';
import { getMatrixRTCTransportKey } from '@rocket.chat/core-typings';
import { liveKitRoomAliasFor } from '@rocket.chat/federation-matrix';
import { Logger } from '@rocket.chat/logger';
import { VideoConference as VideoConferenceModel } from '@rocket.chat/models';

import { getLiveKitConfig, isLiveKitFullyConfigured, isLiveKitLicensed } from './config';
import { createLiveKitAccessToken } from './token';
import { settings } from '../../../../server/settings';

const logger = new Logger('VideoConference/CallConfig');

/** What a client needs to set a call up itself; the provider's own key is present only when it needs configuring. */
export type CallConfig = {
	providerName: string;
	livekit?: { serverUrl: string; token: string; roomName: string };
	federation?: { serverName: string; transport: string; livekitIdentity: string };
};

export type CallConfigError =
	| 'error-videoconf-invalid-call'
	| 'forbidden'
	| 'error-videoconf-livekit-not-licensed'
	| 'error-videoconf-livekit-not-configured'
	| 'error-videoconf-livekit-token-failed'
	| 'error-videoconf-federation-failed';

export type CallConfigResult = { config: CallConfig } | { error: CallConfigError };

const livekitRoomNameFor = (callId: string) => `mc-${callId}`;

const displayNameOf = (user: Pick<IUser, '_id' | 'name' | 'username'>): string =>
	(settings.get<boolean>('UI_Use_Real_Name') ? user.name : user.username) || user.username || user._id;

/** A token to publish and watch in `roomName`; nothing when it could not be minted. */
const mintMemberToken = (
	callId: string,
	roomName: string,
	identity: string,
	user: Pick<IUser, '_id' | 'name' | 'username'>,
): Promise<string | undefined> =>
	createLiveKitAccessToken({
		identity,
		name: displayNameOf(user),
		grant: { roomJoin: true, room: roomName, canPublish: true, canSubscribe: true, canPublishData: true },
	}).catch((err) => {
		logger.error({ msg: 'Failed to mint LiveKit access token', callId, err });
		return undefined;
	});

/**
 * A member of a federated call publishes on this server's SFU, in the room every SFU of the session uses, as the
 * membership this server announces for them.
 */
async function getFederatedCallConfig(
	call: IVideoConference,
	{ mrid, slotId }: VideoConferenceFederation,
	user: IUser,
): Promise<CallConfigResult> {
	const membership = await FederationMatrix.joinRTCSession(call, user).catch((err) => {
		logger.error({ msg: 'Failed to join the MatrixRTC session of a federated call', callId: call._id, err });
		return undefined;
	});
	if (!membership) {
		return { error: 'error-videoconf-federation-failed' };
	}

	const roomName = liveKitRoomAliasFor(mrid, slotId);
	const token = await mintMemberToken(call._id, roomName, membership.livekitIdentity, user);
	if (!token) {
		return { error: 'error-videoconf-livekit-token-failed' };
	}

	return {
		config: {
			providerName: 'livekit',
			livekit: { serverUrl: getLiveKitConfig().url, token, roomName },
			federation: {
				serverName: membership.serverName,
				transport: getMatrixRTCTransportKey(membership.transport),
				livekitIdentity: membership.livekitIdentity,
			},
		},
	};
}

/** The configuration of a call for one of its members. */
export async function getCallConfig(callId: string, user: IUser): Promise<CallConfigResult> {
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

	// Checked here as well as when the provider is offered: a call started while it was licensed outlives the license.
	if (!isLiveKitLicensed()) {
		return { error: 'error-videoconf-livekit-not-licensed' };
	}

	if (!isLiveKitFullyConfigured()) {
		return { error: 'error-videoconf-livekit-not-configured' };
	}

	if (call.federation) {
		return getFederatedCallConfig(call, call.federation, user);
	}

	const roomName = livekitRoomNameFor(callId);
	const token = await mintMemberToken(callId, roomName, user._id, user);
	if (!token) {
		return { error: 'error-videoconf-livekit-token-failed' };
	}

	return { config: { providerName: 'livekit', livekit: { serverUrl: getLiveKitConfig().url, token, roomName } } };
}
