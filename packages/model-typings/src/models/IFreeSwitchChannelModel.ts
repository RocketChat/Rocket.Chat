import type { IFreeSwitchChannel } from '@rocket.chat/core-typings';
import type { AggregateOptions, CountDocumentsOptions, FindCursor, FindOptions, WithoutId, InsertOneResult } from 'mongodb';

import type { IBaseModel, InsertionModel } from './IBaseModel';

export interface IFreeSwitchChannelModel extends IBaseModel<IFreeSwitchChannel> {
	registerChannel(channel: WithoutId<InsertionModel<IFreeSwitchChannel>>): Promise<InsertOneResult<IFreeSwitchChannel>>;
	findAllByUniqueIds<T extends IFreeSwitchChannel>(uniqueIds: string[], options?: FindOptions<IFreeSwitchChannel>): FindCursor<T>;

	countChannelsByKind(kind: Required<IFreeSwitchChannel>['kind'], minDate?: Date, options?: CountDocumentsOptions): Promise<number>;
	countChannelsByKindAndDirection(
		kind: Required<IFreeSwitchChannel>['kind'],
		callDirection: Required<IFreeSwitchChannel>['callDirection'],
		minDate?: Date,
		options?: CountDocumentsOptions,
	): Promise<number>;
	sumChannelsDurationByKind(kind: Required<IFreeSwitchChannel>['kind'], minDate?: Date, options?: AggregateOptions): Promise<number>;
	countChannelsByKindAndSuccessState(
		kind: Required<IFreeSwitchChannel>['kind'],
		success: boolean,
		minDate?: Date,
		options?: CountDocumentsOptions,
	): Promise<number>;
}
