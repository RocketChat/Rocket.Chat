import type { IMediaCall, IMediaCallChannel } from '@rocket.chat/core-typings';

import { getActorChannel } from './getActorChannel';
import { getChannelByCallIdAndRole } from './getChannelByCallIdAndRole';
import { isValidSignalRole } from '../signals/isValidSignalRole';

export async function getOppositeChannel(
	call: IMediaCall,
	channel: IMediaCallChannel,
	options?: { reloadCallIfNull?: boolean },
): Promise<IMediaCallChannel | null> {
	if (!isValidSignalRole(channel.role)) {
		return null;
	}

	const { reloadCallIfNull = false } = options || {};

	const oppositeRole = channel.role === 'caller' ? 'callee' : 'caller';
	const otherChannel = await getActorChannel(call._id, call[oppositeRole]);
	if (otherChannel || !reloadCallIfNull) {
		return otherChannel;
	}

	// If no channel was found, using the data from the call object, reload the call and try again
	// This is needed because the call might have been accepted by ther other participant at the same time as this request.
	return getChannelByCallIdAndRole(call._id, oppositeRole);
}
