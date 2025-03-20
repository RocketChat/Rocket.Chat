import type { IOEmbedCache } from '@rocket.chat/core-typings';
import type { DeleteResult } from 'mongodb';

import type { IBaseModel } from './IBaseModel';

export interface IOEmbedCacheModel extends IBaseModel<IOEmbedCache> {
	createWithIdAndData(_id: string, data: any): Promise<IOEmbedCache>;

	removeBeforeDate(date: Date): Promise<DeleteResult>;
}
