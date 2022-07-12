import type { DeleteResult } from 'mongodb';
import type { IOEmbedCache } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface IOEmbedCacheModel extends IBaseModel<IOEmbedCache> {
	createWithIdAndData(_id: string, data: any): Promise<IOEmbedCache>;

	removeAfterDate(date: Date): Promise<DeleteResult>;
}
