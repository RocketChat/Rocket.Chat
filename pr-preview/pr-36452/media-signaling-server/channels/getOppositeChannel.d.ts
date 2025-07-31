import type { IMediaCall, IMediaCallChannel } from '@rocket.chat/core-typings';
export declare function getOppositeChannel(call: IMediaCall, channel: IMediaCallChannel, options?: {
    reloadCallIfNull?: boolean;
}): Promise<IMediaCallChannel | null>;
