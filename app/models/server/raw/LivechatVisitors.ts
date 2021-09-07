import { escapeRegExp } from '@rocket.chat/string-helpers';
import { AggregationCursor, Cursor, FindOneOptions } from 'mongodb';

import { BaseRaw } from './BaseRaw';
import { ILivechatVisitor } from '../../../../definition/ILivechatVisitor';

export class LivechatVisitorsRaw extends BaseRaw<ILivechatVisitor> {
	getVisitorsBetweenDate({ start, end, department }: { start: Date; end: Date; department: string }): Cursor<ILivechatVisitor> {
		const query = {
			_updatedAt: {
				$gte: new Date(start),
				$lt: new Date(end),
			},
			...department && department !== 'undefined' && { department },
		};

		return this.find(query, { projection: { _id: 1 } });
	}

	findByNameRegexWithExceptionsAndConditions(searchTerm: string, exceptions: string[] = [], conditions: any = {}, options: any = {}): AggregationCursor<ILivechatVisitor> {
		if (!Array.isArray(exceptions)) {
			exceptions = [exceptions];
		}

		const nameRegex = new RegExp(`^${ escapeRegExp(searchTerm).trim() }`, 'i');

		const match = {
			$match: {
				name: nameRegex,
				_id: {
					$nin: exceptions,
				},
				...conditions,
			},
		};

		const { fields, sort, offset, count } = options;
		const project = {
			$project: {
				// eslint-disable-next-line @typescript-eslint/camelcase
				custom_name: { $concat: ['$username', ' - ', '$name'] },
				...fields,
			},
		};

		const order = { $sort: sort || { name: 1 } };
		const params = [match, project, order] as any;

		if (offset) {
			params.push({ $skip: offset });
		}

		if (count) {
			params.push({ $limit: count });
		}

		return this.col.aggregate(params);
	}

	/**
	 * Find visitors by their email or phone or username or name
	 * @return [{object}] List of Visitors from db
	 */
	findVisitorsByEmailOrPhoneOrNameOrUsername(_emailOrPhoneOrNameOrUsername: string, options: FindOneOptions<ILivechatVisitor>): Cursor<ILivechatVisitor> {
		const filter = new RegExp(_emailOrPhoneOrNameOrUsername, 'i');
		const query = {
			$or: [{
				'visitorEmails.address': filter,
			}, {
				'phone.phoneNumber': _emailOrPhoneOrNameOrUsername,
			}, {
				name: filter,
			}, {
				username: filter,
			}],
		};

		return this.find(query, options);
	}
}
