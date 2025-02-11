import type { ILivechatVisitor, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { FindPaginated, ILivechatVisitorsModel } from '@rocket.chat/model-typings';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import type {
	AggregationCursor,
	Collection,
	FindCursor,
	Db,
	Document,
	Filter,
	FindOptions,
	UpdateResult,
	IndexDescription,
	DeleteResult,
	UpdateFilter,
	WithId,
	FindOneAndUpdateOptions,
} from 'mongodb';
import { ObjectId } from 'mongodb';

import { Settings } from '../index';
import { BaseRaw } from './BaseRaw';

export class LivechatVisitorsRaw extends BaseRaw<ILivechatVisitor> implements ILivechatVisitorsModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<ILivechatVisitor>>) {
		super(db, 'livechat_visitor', trash);
	}

	protected modelIndexes(): IndexDescription[] {
		return [
			{ key: { token: 1 } },
			{ key: { 'phone.phoneNumber': 1 }, sparse: true },
			{ key: { 'visitorEmails.address': 1 }, sparse: true },
			{ key: { name: 1 }, sparse: true },
			{ key: { username: 1 } },
			{ key: { 'contactMananger.username': 1 }, sparse: true },
			{ key: { 'livechatData.$**': 1 } },
			// TODO: remove this index in the next major release (8.0.0)
			// { key: { activity: 1 }, partialFilterExpression: { activity: { $exists: true } } },
			{ key: { disabled: 1 }, partialFilterExpression: { disabled: { $exists: true } } },
		];
	}

	findOneVisitorByPhone(phone: string): Promise<ILivechatVisitor | null> {
		const query = {
			'phone.phoneNumber': phone,
		};

		return this.findOne(query);
	}

	async findOneGuestByEmailAddress(emailAddress: string): Promise<ILivechatVisitor | null> {
		if (!emailAddress) {
			return null;
		}

		const query = {
			'visitorEmails.address': String(emailAddress).toLowerCase(),
		};

		return this.findOne(query);
	}

	/**
	 * Find visitors by _id
	 * @param {string} token - Visitor token
	 */
	findById(_id: string, options: FindOptions<ILivechatVisitor>): FindCursor<ILivechatVisitor> {
		const query = {
			_id,
		};

		return this.find(query, options);
	}

	findEnabled(query: Filter<ILivechatVisitor>, options?: FindOptions<ILivechatVisitor>): FindCursor<ILivechatVisitor> {
		return this.find(
			{
				...query,
				disabled: { $ne: true },
			},
			options,
		);
	}

	findOneEnabledById<T extends Document = ILivechatVisitor>(_id: string, options?: FindOptions<ILivechatVisitor>): Promise<T | null> {
		const query = {
			_id,
			disabled: { $ne: true },
		};

		return this.findOne<T>(query, options);
	}

	findVisitorByToken(token: string): FindCursor<ILivechatVisitor> {
		const query = {
			token,
			disabled: { $ne: true },
		};

		return this.find(query);
	}

	getVisitorByToken(token: string, options: FindOptions<ILivechatVisitor>): Promise<ILivechatVisitor | null> {
		const query = {
			token,
		};

		return this.findOne(query, options);
	}

	countVisitorsBetweenDate({ start, end, department }: { start: Date; end: Date; department?: string }): Promise<number> {
		const query = {
			disabled: { $ne: true },
			_updatedAt: {
				$gte: new Date(start),
				$lt: new Date(end),
			},
			...(department && department !== 'undefined' && { department }),
		};

		return this.countDocuments(query);
	}

	async getNextVisitorUsername(): Promise<string> {
		// TODO remove dependency from another model - this logic should be inside a service/function
		const livechatCount = await Settings.incrementValueById('Livechat_guest_count', 1, { returnDocument: 'after' });

		if (!livechatCount) {
			throw new Error("Can't find Livechat_guest_count setting");
		}

		return `guest-${livechatCount.value}`;
	}

	findByNameRegexWithExceptionsAndConditions<P extends Document = ILivechatVisitor>(
		searchTerm: string,
		exceptions: string[] = [],
		conditions: Filter<ILivechatVisitor> = {},
		options: FindOptions<P extends ILivechatVisitor ? ILivechatVisitor : P> = {},
	): AggregationCursor<
		P & {
			custom_name: string;
		}
	> {
		if (!Array.isArray(exceptions)) {
			exceptions = [exceptions];
		}

		const nameRegex = new RegExp(`^${escapeRegExp(searchTerm).trim()}`, 'i');

		const match = {
			$match: {
				name: nameRegex,
				_id: {
					$nin: exceptions,
				},
				...conditions,
			},
		};

		const { projection, sort, skip, limit } = options;
		const project = {
			$project: {
				// TODO: move this logic to client
				custom_name: { $concat: ['$username', ' - ', '$name'] },
				...projection,
			},
		};

		const order = { $sort: sort || { name: 1 } };
		const params: Record<string, unknown>[] = [match, order, skip && { $skip: skip }, limit && { $limit: limit }, project].filter(
			Boolean,
		) as Record<string, unknown>[];

		return this.col.aggregate(params);
	}

	/**
	 * Find visitors by their email or phone or username or name
	 */
	async findPaginatedVisitorsByEmailOrPhoneOrNameOrUsernameOrCustomField(
		emailOrPhone?: string,
		nameOrUsername?: RegExp,
		allowedCustomFields: string[] = [],
		options?: FindOptions<ILivechatVisitor>,
	): Promise<FindPaginated<FindCursor<ILivechatVisitor>>> {
		if (!emailOrPhone && !nameOrUsername && allowedCustomFields.length === 0) {
			return this.findPaginated({ disabled: { $ne: true } }, options);
		}

		const query: Filter<ILivechatVisitor> = {
			$or: [
				...(emailOrPhone
					? [
							{
								'visitorEmails.address': emailOrPhone,
							},
							{
								'phone.phoneNumber': emailOrPhone,
							},
						]
					: []),
				...(nameOrUsername
					? [
							{
								name: nameOrUsername,
							},
							{
								username: nameOrUsername,
							},
						]
					: []),
				...allowedCustomFields.map((c: string) => ({ [`livechatData.${c}`]: nameOrUsername })),
			],
			disabled: { $ne: true },
		};

		return this.findPaginated(query, options);
	}

	async findOneByEmailAndPhoneAndCustomField(
		email: string | null | undefined,
		phone: string | null | undefined,
		customFields?: { [key: string]: RegExp },
	): Promise<ILivechatVisitor | null> {
		const query = Object.assign(
			{
				disabled: { $ne: true },
			},
			{
				...(email && { visitorEmails: { address: email } }),
				...(phone && { phone: { phoneNumber: phone } }),
				...customFields,
			},
		);

		if (Object.keys(query).length === 1) {
			return null;
		}

		return this.findOne(query);
	}

	async updateLivechatDataByToken(
		token: string,
		key: string,
		value: unknown,
		overwrite = true,
	): Promise<UpdateResult | Document | boolean> {
		const query = {
			token,
		};

		if (!overwrite) {
			const user = await this.getVisitorByToken(token, { projection: { livechatData: 1 } });
			if (user?.livechatData && typeof user.livechatData[key] !== 'undefined') {
				return true;
			}
		}

		const update: UpdateFilter<ILivechatVisitor> = {
			$set: {
				[`livechatData.${key}`]: value,
			},
		} as UpdateFilter<ILivechatVisitor>; // TODO: Remove this cast when TypeScript is updated
		// TypeScript is not smart enough to infer that `messages.${string}` matches keys of `ILivechatVisitor`;

		return this.updateOne(query, update);
	}

	updateLastAgentByToken(token: string, lastAgent: ILivechatVisitor['lastAgent']): Promise<Document | UpdateResult> {
		const query = {
			token,
		};

		const update = {
			$set: {
				lastAgent,
			},
		};

		return this.updateOne(query, update);
	}

	updateById(_id: string, update: UpdateFilter<ILivechatVisitor>): Promise<Document | UpdateResult> {
		return this.updateOne({ _id }, update);
	}

	async updateOneByIdOrToken(
		update: Partial<ILivechatVisitor>,
		options?: FindOneAndUpdateOptions,
	): Promise<null | WithId<ILivechatVisitor>> {
		let query: Filter<ILivechatVisitor> = {};

		if (update._id) {
			query = { _id: update._id };
		} else if (update.token) {
			query = { token: update.token };
			update._id = new ObjectId().toHexString();
		}

		return this.findOneAndUpdate(query, { $set: update }, options);
	}

	saveGuestById(
		_id: string,
		data: { name?: string; username?: string; email?: string; phone?: string; livechatData: { [k: string]: any } },
	): Promise<UpdateResult | Document | boolean> {
		const setData: DeepWriteable<UpdateFilter<ILivechatVisitor>['$set']> = {};
		const unsetData: DeepWriteable<UpdateFilter<ILivechatVisitor>['$unset']> = {};

		if (data.name) {
			if (data.name?.trim()) {
				setData.name = data.name.trim();
			} else {
				unsetData.name = 1;
			}
		}

		if (data.email) {
			if (data.email?.trim()) {
				setData.visitorEmails = [{ address: data.email.trim() }];
			} else {
				unsetData.visitorEmails = 1;
			}
		}

		if (data.phone) {
			if (data.phone?.trim()) {
				setData.phone = [{ phoneNumber: data.phone.trim() }];
			} else {
				unsetData.phone = 1;
			}
		}

		if (data.livechatData) {
			Object.keys(data.livechatData).forEach((key) => {
				const value = data.livechatData[key]?.trim();
				if (value) {
					setData[`livechatData.${key}`] = value;
				} else {
					unsetData[`livechatData.${key}`] = 1;
				}
			});
		}

		const update: UpdateFilter<ILivechatVisitor> = {
			...(Object.keys(setData).length && { $set: setData as UpdateFilter<ILivechatVisitor>['$set'] }),
			...(Object.keys(unsetData).length && { $unset: unsetData as UpdateFilter<ILivechatVisitor>['$unset'] }),
		};

		if (!Object.keys(update).length) {
			return Promise.resolve(true);
		}

		return this.updateOne({ _id }, update);
	}

	removeDepartmentById(_id: string): Promise<UpdateResult> {
		return this.updateOne({ _id }, { $unset: { department: 1 } });
	}

	removeById(_id: string): Promise<DeleteResult> {
		return this.deleteOne({ _id });
	}

	saveGuestEmailPhoneById(_id: string, emails: string[], phones: string[]): Promise<UpdateResult | Document | void> {
		const saveEmail = ([] as string[])
			.concat(emails)
			.filter((email) => email?.trim())
			.map((email) => ({ address: email }));

		const savePhone = ([] as string[])
			.concat(phones)
			.filter((phone) => phone?.trim().replace(/[^\d]/g, ''))
			.map((phone) => ({ phoneNumber: phone }));

		const update: UpdateFilter<ILivechatVisitor> = {
			$addToSet: {
				...(saveEmail.length && { visitorEmails: { $each: saveEmail } }),
				...(savePhone.length && { phone: { $each: savePhone } }),
			},
		};

		if (!Object.keys(update.$addToSet as Record<string, any>).length) {
			return Promise.resolve();
		}

		return this.updateOne({ _id }, update);
	}

	removeContactManagerByUsername(manager: string): Promise<Document | UpdateResult> {
		return this.updateMany(
			{
				contactManager: {
					username: manager,
				},
			},
			{
				$unset: {
					contactManager: true,
				},
			},
		);
	}

	disableById(_id: string): Promise<UpdateResult> {
		return this.updateOne(
			{ _id },
			{
				$set: { disabled: true },
				$unset: {
					department: 1,
					contactManager: 1,
					token: 1,
					visitorEmails: 1,
					phone: 1,
					name: 1,
					livechatData: 1,
					lastChat: 1,
					ip: 1,
					host: 1,
					userAgent: 1,
					username: 1,
					ts: 1,
					status: 1,
				},
			},
		);
	}

	setLastChatById(_id: string, lastChat: Required<ILivechatVisitor['lastChat']>): Promise<UpdateResult> {
		return this.updateOne(
			{ _id },
			{
				$set: {
					lastChat,
				},
			},
		);
	}
}

type DeepWriteable<T> = { -readonly [P in keyof T]: DeepWriteable<T[P]> };
