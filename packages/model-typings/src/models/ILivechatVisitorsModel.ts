import type { AggregationCursor, FindCursor, Filter, FindOptions, UpdateResult, Document } from 'mongodb';
import type { ILivechatVisitor } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface ILivechatVisitorsModel extends IBaseModel<ILivechatVisitor> {
	findById(_id: string, options: FindOptions<ILivechatVisitor>): FindCursor<ILivechatVisitor>;
	getVisitorByToken(token: string, options: FindOptions<ILivechatVisitor>): Promise<ILivechatVisitor | null>;
	getVisitorsBetweenDate({ start, end, department }: { start: Date; end: Date; department: string }): FindCursor<ILivechatVisitor>;
	findByNameRegexWithExceptionsAndConditions<P = ILivechatVisitor>(
		searchTerm: string,
		exceptions: string[],
		conditions: Filter<ILivechatVisitor>,
		options: FindOptions<P extends ILivechatVisitor ? ILivechatVisitor : P>,
	): AggregationCursor<
		P & {
			custom_name: string;
		}
	>;
	findVisitorsByEmailOrPhoneOrNameOrUsername(
		_emailOrPhoneOrNameOrUsername: string,
		options: FindOptions<ILivechatVisitor>,
	): FindCursor<ILivechatVisitor>;
	removeContactManagerByUsername(manager: string): Promise<UpdateResult>;

	updateLivechatDataByToken(token: string, key: string, value: unknown, overwrite: boolean): Promise<UpdateResult | Document | boolean>;

	findOneGuestByEmailAddress(emailAddress: string): Promise<ILivechatVisitor | null>;

	findOneVisitorByPhone(phone: string): Promise<ILivechatVisitor | null>;

	removeDepartmentById(_id: string): Promise<Document | UpdateResult>;
}
