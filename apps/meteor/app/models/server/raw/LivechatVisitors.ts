import { escapeRegExp } from '@rocket.chat/string-helpers';
import { AggregationCursor, Cursor, FilterQuery, FindOneOptions, WithoutProjection } from 'mongodb';
import type { ILivechatVisitor } from '@rocket.chat/core-typings';

import { BaseRaw } from './BaseRaw';

export class LivechatVisitorsRaw extends BaseRaw<ILivechatVisitor> {
	findOneById(_id: string, options: WithoutProjection<FindOneOptions<ILivechatVisitor>>): Promise<ILivechatVisitor | null> {
		const query = {
			_id,
		};

		return this.findOne(query, options);
	}

	getVisitorByToken(token: string, options: WithoutProjection<FindOneOptions<ILivechatVisitor>>): Promise<ILivechatVisitor | null> {
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
}
