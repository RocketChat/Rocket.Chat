import type {
	AggregationCursor,
	Cursor,
	FilterQuery,
	FindOneOptions,
	WithoutProjection,
	UpdateWriteOpResult,
	WriteOpResult,
} from 'mongodb';
import type { ILivechatVisitor } from '@rocket.chat/core-typings';

import type { IBaseModel } from './IBaseModel';

export interface ILivechatVisitorsModel extends IBaseModel<ILivechatVisitor> {
	findById(_id: string, options: FindOneOptions<ILivechatVisitor>): Cursor<ILivechatVisitor>;
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

	updateLivechatDataByToken(token: string, key: string, value: unknown, overwrite: boolean): Promise<WriteOpResult | boolean>;

	findOneGuestByEmailAddress(emailAddress: string): Promise<ILivechatVisitor | null>;

	findOneVisitorByPhone(phone: string): Promise<ILivechatVisitor | null>;

	removeDepartmentById(_id: string): Promise<WriteOpResult>;
}
