import type { IMessage } from '@rocket.chat/core-typings';
import type { ReadReceipt } from '../../../../definition/ReadReceipt';

export type GetReadReceiptsMethod = (options: { messageId: IMessage['_id'] }) => Array<ReadReceipt>;
