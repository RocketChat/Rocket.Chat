import { Authorization, FederationMatrix } from '@rocket.chat/core-services';
import type { IUser } from '@rocket.chat/core-typings';
import { VideoConferenceStatus } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import { VideoConference as VideoConferenceModel } from '@rocket.chat/models';

const logger = new Logger('VideoConference/FederatedToken');

export type FederatedToken = { serverUrl: string; token: string };

export type FederatedTokenError =
	'error-videoconf-invalid-call' | 'forbidden' | 'error-videoconf-not-federated' | 'error-videoconf-federated-token-failed';

export type FederatedTokenResult = { token: FederatedToken } | { error: FederatedTokenError };

const RUNNING_STATUSES = [VideoConferenceStatus.CALLING, VideoConferenceStatus.STARTED];

/**
 * A token for a member of a federated call to watch, on another homeserver's SFU, the members that homeserver hosts:
 * those whose roster entry names `serverName` and `transport`.
 */
export async function getFederatedToken(callId: string, user: IUser, serverName: string, transport: string): Promise<FederatedTokenResult> {
	const call = await VideoConferenceModel.findOneById(callId);
	if (!call?.rid || call.endedAt || !RUNNING_STATUSES.includes(call.status)) {
		return { error: 'error-videoconf-invalid-call' };
	}

	// Call membership is granted without room access, so the conference rule applies rather than the room's.
	if (!(await Authorization.canAccessConference(call, user._id))) {
		return { error: 'forbidden' };
	}

	if (call.providerName !== 'livekit' || !call.federation) {
		return { error: 'error-videoconf-not-federated' };
	}

	try {
		return { token: await FederationMatrix.getRemoteLiveKitToken(call, user, serverName, transport) };
	} catch (err) {
		logger.error({ msg: "Failed to get a token for another homeserver's SFU", callId, serverName, transport, err });
		return { error: 'error-videoconf-federated-token-failed' };
	}
}
