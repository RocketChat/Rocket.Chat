import type { FindCursor } from 'mongodb';
import type { Reads } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface IReadsModel extends IBaseModel<Reads> {
	findByThreadId(tmid: string): FindCursor<Reads>;
    getMinimumLastSeenByThreadId(tmid: string): Promise<Reads | null>;
}
