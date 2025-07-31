import type { IMediaCallChannel } from '@rocket.chat/core-typings';
import type { MediaSignalRequestOffer } from '@rocket.chat/media-signaling';
export declare function requestChannelOffer(channel: IMediaCallChannel, params: MediaSignalRequestOffer): Promise<void>;
