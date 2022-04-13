import type { IMessage, ReadReceipt } from '@rocket.chat/core-typings';

export type GetReadReceiptsMethod = (options: { messageId: IMessage['_id'] }) => Array<ReadReceipt>;
