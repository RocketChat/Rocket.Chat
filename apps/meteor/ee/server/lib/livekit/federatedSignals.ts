import { Authorization, FederationMatrix } from '@rocket.chat/core-services';
import type { IUser, IVideoConference } from '@rocket.chat/core-typings';
import { VideoConferenceStatus } from '@rocket.chat/core-typings';
import { Logger } from '@rocket.chat/logger';
import { VideoConference as VideoConferenceModel } from '@rocket.chat/models';

const logger = new Logger('VideoConference/FederatedSignals');

export type FederatedSignalError =
	'error-videoconf-invalid-call' | 'forbidden' | 'error-videoconf-not-federated' | 'error-videoconf-federated-signal-failed';

export type FederatedSignalResult = { sent: true } | { error: FederatedSignalError };

const RUNNING_STATUSES = [VideoConferenceStatus.CALLING, VideoConferenceStatus.STARTED];

/**
 * Tells the members of other servers in a federated call something one of this server's members did in it. The
 * members of this server learn it over the call itself, so nothing is sent outside a federated call.
 */
async function signal(
	callId: string,
	user: IUser,
	what: string,
	send: (call: IVideoConference) => Promise<void>,
): Promise<FederatedSignalResult> {
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
		await send(call);
		return { sent: true };
	} catch (err) {
		logger.error({ msg: `Failed to tell other homeservers about a ${what}`, callId, err });
		return { error: 'error-videoconf-federated-signal-failed' };
	}
}

export const sendFederatedHand = (callId: string, user: IUser, raised: boolean): Promise<FederatedSignalResult> =>
	signal(callId, user, 'raised hand', (call) => FederationMatrix.sendRTCHand(call, user, raised));

export const sendFederatedReaction = (callId: string, user: IUser, emoji: string): Promise<FederatedSignalResult> =>
	signal(callId, user, 'reaction', (call) => FederationMatrix.sendRTCReaction(call, user, emoji));
