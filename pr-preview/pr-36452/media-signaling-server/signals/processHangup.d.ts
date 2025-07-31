import type { IMediaCall, ValidSignalChannel } from '@rocket.chat/core-typings';
import type { MediaSignalHangup } from '@rocket.chat/media-signaling';
export declare function processHangup(params: MediaSignalHangup, call: IMediaCall, channel: ValidSignalChannel): Promise<void>;
