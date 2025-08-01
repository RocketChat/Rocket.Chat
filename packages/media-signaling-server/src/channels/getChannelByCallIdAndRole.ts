import type { IMediaCall, IMediaCallChannel } from '@rocket.chat/core-typings';
import { MediaCalls } from '@rocket.chat/models';

import { getActorChannel } from './getActorChannel';

export async function getChannelByCallIdAndRole<T extends 'caller' | 'callee'>(
	callId: IMediaCall['_id'],
	role: T,
): Promise<IMediaCallChannel | null> {
	const call = await MediaCalls.findOneById<Pick<IMediaCall, '_id' | T>>(callId, { projection: { [role]: 1 } });
	if (!call) {
		return null;
	}

	const { [role]: actor } = call;
	if (!actor) {
		return null;
	}

	return getActorChannel(callId, actor);
}
