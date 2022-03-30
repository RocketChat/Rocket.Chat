import { IMessage, ReadReceipt } from '@rocket.chat/core-typings';

export type GetReadReceiptsMethod = (options: { mid: IMessage['_id'] }) => Array<ReadReceipt>;
