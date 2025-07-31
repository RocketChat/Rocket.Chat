import type { IMediaCall, ValidSignalChannel } from '@rocket.chat/core-typings';
import type { MediaSignalAnswer } from '@rocket.chat/media-signaling';
export declare function processAnswer(params: MediaSignalAnswer, call: IMediaCall, channel: ValidSignalChannel): Promise<void>;
