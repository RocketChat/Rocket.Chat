import type { IVisitorExternalIdentifier, ILivechatVisitor } from '@rocket.chat/core-typings';
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
import type { DocumentWithProjection, FindOptionsWithProjection } from '../types/DocumentWithProjection';

export interface ILivechatVisitorsModel extends IBaseModel<ILivechatVisitor> {
	findById<T extends Document = ILivechatVisitor, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		_id: string,
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
	findByIds<T extends Document = ILivechatVisitor, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		ids: string[],
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;
	getVisitorByToken<T extends Document = ILivechatVisitor, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		token: string,
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;
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

	findPaginatedVisitorsByEmailOrPhoneOrNameOrUsernameOrCustomField<
		T extends Document = ILivechatVisitor,
		O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>,
	>(
		emailOrPhone?: string,
		nameOrUsername?: RegExp,
		allowedCustomFields?: string[],
		options?: O,
	): Promise<FindPaginated<FindCursor<DocumentWithProjection<T, O>>>>;

	findOneByEmailAndPhoneAndCustomField(
		email: string | null | undefined,
		phone: string | null | undefined,
		customFields?: { [key: string]: RegExp },
	): Promise<ILivechatVisitor | null>;

	removeContactManagerByUsername(manager: string): Promise<UpdateResult | Document>;

	updateAllLivechatDataByToken(token: string, livechatDataToUpdate: Record<string, string>): Promise<UpdateResult>;

	updateLivechatDataByToken(token: string, key: string, value: unknown, overwrite: boolean): Promise<UpdateResult | Document | boolean>;

	findOneGuestByEmailAddress(emailAddress: string): Promise<ILivechatVisitor | null>;

	findOneVisitorByPhone(phone: string): Promise<ILivechatVisitor | null>;

	findOneVisitorByPhoneOrEmailAndAddExternalId(
		contactData: { phone: string } | { email: string },
		appId: string,
		externalId: Omit<IVisitorExternalIdentifier, 'appId'>,
	): Promise<ILivechatVisitor | null>;

	findOneByExternalId(entityId: string): Promise<ILivechatVisitor | null>;

	updateExternalIdById(_id: string, appId: string, externalId: Omit<IVisitorExternalIdentifier, 'appId'>): Promise<ILivechatVisitor | null>;

	removeDepartmentById(_id: string): Promise<Document | UpdateResult>;

	getNextVisitorUsername(): Promise<string>;

	updateLastAgentByToken(token: string, lastAgent: ILivechatVisitor['lastAgent']): Promise<Document | UpdateResult>;

	updateById(_id: string, update: UpdateFilter<ILivechatVisitor>): Promise<Document | UpdateResult>;

	updateOneByIdOrToken(update: UpdateFilter<ILivechatVisitor>, options?: FindOneAndUpdateOptions): Promise<null | WithId<ILivechatVisitor>>;

	saveGuestEmailPhoneById(_id: string, emails: string[], phones: string[]): Promise<UpdateResult | Document | void>;

	findOneEnabledById<T extends Document = ILivechatVisitor, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		_id: string,
		options?: O,
	): Promise<DocumentWithProjection<T, O> | null>;

	disableById(_id: string): Promise<UpdateResult>;

	findEnabled<T extends Document = ILivechatVisitor, O extends FindOptionsWithProjection<T> = FindOptionsWithProjection<T>>(
		query: Filter<ILivechatVisitor>,
		options?: O,
	): FindCursor<DocumentWithProjection<T, O>>;

	saveGuestById(
		_id: string,
		data: { name?: string; username?: string; email?: string; phone?: string; livechatData: { [k: string]: any } },
	): Promise<UpdateResult | Document | boolean>;
	setLastChatById(_id: string, lastChat: Required<ILivechatVisitor['lastChat']>): Promise<UpdateResult>;
	countVisitorsBetweenDate({ start, end, department }: { start: Date; end: Date; department?: string }): Promise<number>;
	updateDepartmentById(_id: string, department: string): Promise<null | WithId<ILivechatVisitor>>;
}
