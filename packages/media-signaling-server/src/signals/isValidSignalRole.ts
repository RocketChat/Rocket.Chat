import type { IMediaCallChannel } from '@rocket.chat/core-typings';
import type { MediaSignal } from '@rocket.chat/media-signaling';

export function isValidSignalRole(channelRole: IMediaCallChannel['role']): channelRole is MediaSignal['role'] {
	return ['caller', 'callee'].includes(channelRole);
}
