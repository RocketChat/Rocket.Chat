import type { IMediaCall, IMediaCallChannel, MediaCallActor } from '@rocket.chat/core-typings';
import { MediaCallChannels } from '@rocket.chat/models';

export async function getActorChannel(callId: IMediaCall['_id'], actor: MediaCallActor): Promise<IMediaCallChannel | null> {
	if (actor.type !== 'user') {
		throw new Error('not-implemented');
	}

	// If there is no sessionId yet, we can't determine which channel is going to be used by this actor
	if (!actor.sessionId) {
		return null;
	}

	return MediaCallChannels.findOneByCallIdAndParticipant(callId, actor);
}
