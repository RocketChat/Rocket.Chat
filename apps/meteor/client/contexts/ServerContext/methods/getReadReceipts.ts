import type { IMessage } from '@rocket.chat/core-typings';
import type { ReadReceipt } from '@rocket.chat/core-typings';

export type GetReadReceiptsMethod = (options: { messageId: IMessage['_id'] }) => Array<ReadReceipt>;
