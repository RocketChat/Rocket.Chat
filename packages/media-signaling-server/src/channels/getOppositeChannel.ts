import type { IMediaCall, IMediaCallChannel } from '@rocket.chat/core-typings';

import { getActorChannel } from './getActorChannel';

export async function getOppositeChannel(call: IMediaCall, channel: IMediaCallChannel): Promise<IMediaCallChannel | null> {
	switch (channel.role) {
		case 'callee':
			return getActorChannel(call._id, call.caller);
		case 'caller':
			return getActorChannel(call._id, call.callee);
		default:
			return null;
	}
}
