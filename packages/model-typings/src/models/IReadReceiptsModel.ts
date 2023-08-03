import type { ReadReceipt } from '@rocket.chat/core-typings';
import type { FindCursor } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface IReadReceiptsModel extends IBaseModel<ReadReceipt> {
	findByMessageId(messageId: string): FindCursor<ReadReceipt>;
}
