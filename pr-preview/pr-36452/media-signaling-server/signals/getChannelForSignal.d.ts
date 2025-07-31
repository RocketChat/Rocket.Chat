import type { IMediaCallChannel, ValidSignalChannel } from '@rocket.chat/core-typings';
export declare function getChannelForSignal(channelData: Pick<IMediaCallChannel, 'participant' | 'callId' | 'role'>): Promise<ValidSignalChannel>;
