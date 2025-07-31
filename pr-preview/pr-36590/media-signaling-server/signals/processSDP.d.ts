import type { IMediaCall, ValidSignalChannel } from '@rocket.chat/core-typings';
import type { MediaSignalSDP } from '@rocket.chat/media-signaling';
export declare function processSDP(params: MediaSignalSDP, call: IMediaCall, channel: ValidSignalChannel): Promise<void>;
