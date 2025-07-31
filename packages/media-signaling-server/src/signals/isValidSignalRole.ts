import type { IMediaCallChannel } from '@rocket.chat/core-typings';
import type { CallRole } from '@rocket.chat/media-signaling';

export function isValidSignalRole(channelRole: IMediaCallChannel['role']): channelRole is CallRole {
	return ['caller', 'callee'].includes(channelRole);
}
