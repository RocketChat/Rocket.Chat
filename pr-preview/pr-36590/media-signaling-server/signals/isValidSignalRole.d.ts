import type { IMediaCallChannel } from '@rocket.chat/core-typings';
import type { CallRole } from '@rocket.chat/media-signaling';
export declare function isValidSignalRole(channelRole: IMediaCallChannel['role']): channelRole is CallRole;
