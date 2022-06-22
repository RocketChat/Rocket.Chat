import type { Cursor } from 'mongodb';
import type { ReadReceipt } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface IReadReceiptsModel extends IBaseModel<ReadReceipt> {
	findByMessageId(messageId: string): Cursor<ReadReceipt>;
}
