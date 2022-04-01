import type { IMessage } from '../../../../definition/IMessage';
import type { ReadReceipt } from '../../../../definition/ReadReceipt';

export type GetReadReceiptsMethod = (options: { messageId: IMessage['_id'] }) => Array<ReadReceipt>;
