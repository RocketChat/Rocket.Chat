import type { ILivechatVisitor, ISetting, RocketChatRecordDeleted } from '@rocket.chat/core-typings';
import type { ILivechatVisitorsModel } from '@rocket.chat/model-typings';
import type {
	AggregationCursor,
	Collection,
	Cursor,
	Db,
	FilterQuery,
	FindOneOptions,
	UpdateWriteOpResult,
	IndexSpecification,
	DeleteWriteOpResultObject,
	UpdateQuery,
	WriteOpResult,
} from 'mongodb';
import { getCollectionName, Settings } from '@rocket.chat/models';
import { escapeRegExp } from '@rocket.chat/string-helpers';

import { BaseRaw } from './BaseRaw';

export class LivechatVisitorsRaw extends BaseRaw<ILivechatVisitor> implements ILivechatVisitorsModel {
	constructor(db: Db, trash?: Collection<RocketChatRecordDeleted<ILivechatVisitor>>) {
		super(db, getCollectionName('livechat_visitor'), trash);
	}

	protected modelIndexes(): IndexSpecification[] {
		return [
			{ key: { token: 1 } },
			{ key: { 'phone.phoneNumber': 1 }, sparse: true },
			{ key: { 'visitorEmails.address': 1 }, sparse: true },
			{ key: { name: 1 }, sparse: true },
			{ key: { username: 1 } },
			{ key: { 'contactMananger.username': 1 }, sparse: true },
		];
	}

	findOneVisitorByPhone(phone: string): Promise<ILivechatVisitor | null> {
		const query = {
			'phone.phoneNumber': phone,
		};

		return this.findOne(query);
	}

	findOneGuestByEmailAddress(emailAddress: string): Promise<ILivechatVisitor | null> {
		const query = {
			'visitorEmails.address': String(emailAddress).toLowerCase(),
		};

		return this.findOne(query);
	}

	/**
	 * Find visitors by _id
	 * @param {string} token - Visitor token
	 */
	findById(_id: string, options: FindOneOptions<ILivechatVisitor>): Cursor<ILivechatVisitor> {
		const query = {
			_id,
		};

		return this.find(query, options);
	}

	findVisitorByToken(token: string): Cursor<ILivechatVisitor> {
		const query = {
			token,
		};

		return this.find(query);
	}

	getVisitorByToken(token: string, options: FindOneOptions<ILivechatVisitor>): Promise<ILivechatVisitor | null> {
		const query = {
			token,
		};

		return this.findOne(query, options);
	}

	getVisitorsBetweenDate({ start, end, department }: { start: Date; end: Date; department: string }): Cursor<ILivechatVisitor> {
		const query = {
			_updatedAt: {
				$gte: new Date(start),
				$lt: new Date(end),
			},
			...(department && department !== 'undefined' && { department }),
		};

		return this.find(query, { projection: { _id: 1 } });
	}

	async getNextVisitorUsername(): Promise<string> {
		const query = {
			_id: 'Livechat_guest_count',
		};

		const update: UpdateQuery<ISetting> = {
			$inc: {
				// @ts-expect-error looks like the typings of ISetting.value conflict with this type of update
				value: 1,
			},
		};

		const livechatCount = await Settings.findOneAndUpdate(query, update, { returnDocument: 'after' });

		if (!livechatCount.value) {
			throw new Error("Can't find Livechat_guest_count setting");
		}

		return `guest-${livechatCount.value.value}`;
	}

	findByNameRegexWithExceptionsAndConditions<P = ILivechatVisitor>(
		searchTerm: string,
		exceptions: string[] = [],
		conditions: FilterQuery<ILivechatVisitor> = {},
		options: FindOneOptions<P extends ILivechatVisitor ? ILivechatVisitor : P> = {},
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
				// eslint-disable-next-line @typescript-eslint/camelcase
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
	 * @return [{object}] List of Visitors from db
	 */
	findVisitorsByEmailOrPhoneOrNameOrUsername(
		_emailOrPhoneOrNameOrUsername: string,
		options: FindOneOptions<ILivechatVisitor>,
	): Cursor<ILivechatVisitor> {
		const filter = new RegExp(_emailOrPhoneOrNameOrUsername, 'i');
		const query = {
			$or: [
				{
					'visitorEmails.address': _emailOrPhoneOrNameOrUsername,
				},
				{
					'phone.phoneNumber': _emailOrPhoneOrNameOrUsername,
				},
				{
					name: filter,
				},
				{
					username: filter,
				},
			],
		};

		return this.find(query, options);
	}

	async updateLivechatDataByToken(token: string, key: string, value: unknown, overwrite = true): Promise<WriteOpResult | boolean> {
		const query = {
			token,
		};

		if (!overwrite) {
			const user = await this.getVisitorByToken(token, { projection: { livechatData: 1 } });
			if (user?.livechatData && typeof user.livechatData[key] !== 'undefined') {
				return true;
			}
		}

		const update = {
			$set: {
				[`livechatData.${key}`]: value,
			},
		};

		return this.update(query, update);
	}

	updateLastAgentByToken(token: string, lastAgent: ILivechatVisitor['lastAgent']): Promise<WriteOpResult> {
		const query = {
			token,
		};

		const update = {
			$set: {
				lastAgent,
			},
		};

		return this.update(query, update);
	}

	updateById(_id: string, update: UpdateQuery<ILivechatVisitor>): Promise<WriteOpResult> {
		return this.update({ _id }, update);
	}

	saveGuestById(
		_id: string,
		data: { name?: string; username?: string; email?: string; phone?: string; livechatData: { [k: string]: any } },
	): Promise<WriteOpResult | boolean> {
		const setData: DeepWriteable<UpdateQuery<ILivechatVisitor>['$set']> = {};
		const unsetData: DeepWriteable<UpdateQuery<ILivechatVisitor>['$unset']> = {};

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

		const update: UpdateQuery<ILivechatVisitor> = {
			...(Object.keys(setData).length && { $set: setData as UpdateQuery<ILivechatVisitor>['$set'] }),
			...(Object.keys(unsetData).length && { $unset: unsetData as UpdateQuery<ILivechatVisitor>['$unset'] }),
		};

		if (!Object.keys(update).length) {
			return Promise.resolve(true);
		}

		return this.update({ _id }, update);
	}

	removeDepartmentById(_id: string): Promise<WriteOpResult> {
		return this.update({ _id }, { $unset: { department: 1 } });
	}

	removeById(_id: string): Promise<DeleteWriteOpResultObject> {
		return this.removeById(_id);
	}

	saveGuestEmailPhoneById(_id: string, emails: string[], phones: string[]): Promise<WriteOpResult | void> {
		const update: DeepWriteable<UpdateQuery<ILivechatVisitor>> = {
			$addToSet: {},
		};

		const saveEmail = ([] as string[])
			.concat(emails)
			.filter((email) => email?.trim())
			.map((email) => ({ address: email }));

		if (update.$addToSet && saveEmail.length > 0) {
			update.$addToSet.visitorEmails = { $each: saveEmail };
		}

		const savePhone = ([] as string[])
			.concat(phones)
			.filter((phone) => phone?.trim().replace(/[^\d]/g, ''))
			.map((phone) => ({ phoneNumber: phone }));

		if (update.$addToSet && savePhone.length > 0) {
			update.$addToSet.phone = { $each: savePhone };
		}

		if (!Object.keys(update).length) {
			return Promise.resolve();
		}

		return this.update({ _id }, update as UpdateQuery<ILivechatVisitor>);
	}

	removeContactManagerByUsername(manager: string): Promise<UpdateWriteOpResult> {
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
}

type DeepWriteable<T> = { -readonly [P in keyof T]: DeepWriteable<T[P]> };
