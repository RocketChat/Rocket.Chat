import type { ValidSignalChannel } from '@rocket.chat/core-typings';
import type { MediaSignalBodyAndType, MediaSignalType } from '@rocket.chat/media-signaling';
export declare function sendSignalToChannels<T extends MediaSignalType>(channel: ValidSignalChannel[], signal: MediaSignalBodyAndType<T>): Promise<void>;
