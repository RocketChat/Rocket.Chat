import type { AggregationCursor, Cursor, FilterQuery, FindOneOptions, WithoutProjection, UpdateWriteOpResult } from 'mongodb';
import type { ILivechatVisitor } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface ILivechatVisitorsModel extends IBaseModel<ILivechatVisitor> {
	findOneById(_id: string, options: WithoutProjection<FindOneOptions<ILivechatVisitor>>): Promise<ILivechatVisitor | null>;
	getVisitorByToken(token: string, options: WithoutProjection<FindOneOptions<ILivechatVisitor>>): Promise<ILivechatVisitor | null>;
	getVisitorsBetweenDate({ start, end, department }: { start: Date; end: Date; department: string }): Cursor<ILivechatVisitor>;
	findByNameRegexWithExceptionsAndConditions<P = ILivechatVisitor>(
		searchTerm: string,
		exceptions: string[],
		conditions: FilterQuery<ILivechatVisitor>,
		options: FindOneOptions<P extends ILivechatVisitor ? ILivechatVisitor : P>,
	): AggregationCursor<
		P & {
			custom_name: string;
		}
	>;
	findVisitorsByEmailOrPhoneOrNameOrUsername(
		_emailOrPhoneOrNameOrUsername: string,
		options: FindOneOptions<ILivechatVisitor>,
	): Cursor<ILivechatVisitor>;
	removeContactManagerByUsername(manager: string): Promise<UpdateWriteOpResult>;
}
