import type { IMediaCallChannel } from '@rocket.chat/core-typings';
import type { MediaSignalSDP } from '@rocket.chat/media-signaling';
export declare function deliverChannelSDP(channel: IMediaCallChannel, body: MediaSignalSDP): Promise<void>;
