import type { IMediaCall } from '@rocket.chat/core-typings';
import { MediaCalls } from '@rocket.chat/models';

export async function getNewCallSequence(callId: IMediaCall['_id']): Promise<IMediaCall> {
	const call = await MediaCalls.getNewSequence(callId);
	if (!call) {
		throw new Error('failed-to-reserve-sequence');
	}

	return call;
}
