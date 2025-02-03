import type { ILivechatVisitor } from '@rocket.chat/core-typings';
import type {
	AggregationCursor,
	FindCursor,
	Filter,
	FindOptions,
	UpdateResult,
	Document,
	UpdateFilter,
	FindOneAndUpdateOptions,
	WithId,
} from 'mongodb';

import type { FindPaginated, IBaseModel } from './IBaseModel';

export interface ILivechatVisitorsModel extends IBaseModel<ILivechatVisitor> {
	findById(_id: string, options?: FindOptions<ILivechatVisitor>): FindCursor<ILivechatVisitor>;
	getVisitorByToken(token: string, options?: FindOptions<ILivechatVisitor>): Promise<ILivechatVisitor | null>;
	findByNameRegexWithExceptionsAndConditions<P extends Document = ILivechatVisitor>(
		searchTerm: string,
		exceptions: string[],
		conditions: Filter<ILivechatVisitor>,
		options?: FindOptions<P extends ILivechatVisitor ? ILivechatVisitor : P>,
	): AggregationCursor<
		P & {
			custom_name: string;
		}
	>;

	findPaginatedVisitorsByEmailOrPhoneOrNameOrUsernameOrCustomField(
		emailOrPhone?: string,
		nameOrUsername?: RegExp,
		allowedCustomFields?: string[],
		options?: FindOptions<ILivechatVisitor>,
	): Promise<FindPaginated<FindCursor<ILivechatVisitor>>>;

	findOneByEmailAndPhoneAndCustomField(
		email: string | null | undefined,
		phone: string | null | undefined,
		customFields?: { [key: string]: RegExp },
	): Promise<ILivechatVisitor | null>;

	removeContactManagerByUsername(manager: string): Promise<UpdateResult | Document>;

	updateLivechatDataByToken(token: string, key: string, value: unknown, overwrite: boolean): Promise<UpdateResult | Document | boolean>;

	findOneGuestByEmailAddress(emailAddress: string): Promise<ILivechatVisitor | null>;

	findOneVisitorByPhone(phone: string): Promise<ILivechatVisitor | null>;

	removeDepartmentById(_id: string): Promise<Document | UpdateResult>;

	getNextVisitorUsername(): Promise<string>;

	updateLastAgentByToken(token: string, lastAgent: ILivechatVisitor['lastAgent']): Promise<Document | UpdateResult>;

	updateById(_id: string, update: UpdateFilter<ILivechatVisitor>): Promise<Document | UpdateResult>;

	updateOneByIdOrToken(update: UpdateFilter<ILivechatVisitor>, options?: FindOneAndUpdateOptions): Promise<null | WithId<ILivechatVisitor>>;

	saveGuestEmailPhoneById(_id: string, emails: string[], phones: string[]): Promise<UpdateResult | Document | void>;

	findOneEnabledById<T extends Document = ILivechatVisitor>(_id: string, options?: FindOptions<ILivechatVisitor>): Promise<T | null>;

	disableById(_id: string): Promise<UpdateResult>;

	findEnabled(query: Filter<ILivechatVisitor>, options?: FindOptions<ILivechatVisitor>): FindCursor<ILivechatVisitor>;

	saveGuestById(
		_id: string,
		data: { name?: string; username?: string; email?: string; phone?: string; livechatData: { [k: string]: any } },
	): Promise<UpdateResult | Document | boolean>;
	setLastChatById(_id: string, lastChat: Required<ILivechatVisitor['lastChat']>): Promise<UpdateResult>;
	countVisitorsBetweenDate({ start, end, department }: { start: Date; end: Date; department?: string }): Promise<number>;
}
