import type { IScheduledConference } from '@rocket.chat/core-typings';
import type { FindOptions } from 'mongodb';

import type { IBaseModel, InsertionModel } from './IBaseModel';

export interface IScheduledConferencesModel extends IBaseModel<IScheduledConference> {
	/** Rejects with a duplicate-key error when the alias is already reserved. */
	create(data: Omit<InsertionModel<IScheduledConference>, 'createdAt'>): Promise<IScheduledConference['_id']>;
	findOneBySipAlias<T extends IScheduledConference>(sipAlias: string, options?: FindOptions<T>): Promise<T | null>;
}
