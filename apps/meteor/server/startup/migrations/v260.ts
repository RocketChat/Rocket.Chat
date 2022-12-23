import type { ILivechatVisitor } from '@rocket.chat/core-typings';
import type { AnyBulkWriteOperation, FindCursor } from 'mongodb';
import { LivechatVisitors } from '@rocket.chat/models';

import { addMigration } from '../../lib/migrations';
import { Users } from '../../../app/models/server';

const getNextPageCursor = (skip: number, limit: number): FindCursor<ILivechatVisitor> => {
	return LivechatVisitors.find({ 'visitorEmails.address': /[A-Z]/ }, { skip, limit, sort: { _id: 1 } });
};

// Convert all visitor emails to lowercase
addMigration({
	version: 260,
	async up() {
		const updates: AnyBulkWriteOperation<ILivechatVisitor>[] = [];
		const count = await LivechatVisitors.find({ 'visitorEmails.address': /[A-Z]/ }).count();
		const limit = 5000;
		let skip = 0;

		const incrementSkip = (by: number): void => {
			skip += by;
			updates.length = 0;
		};
		while (skip <= count) {
			getNextPageCursor(skip, limit).forEach((user: ILivechatVisitor) => {
				const visitorEmails = user.visitorEmails?.map((e) => {
					e.address = e.address.toLowerCase();
					return e;
				});
				updates.push({ updateOne: { filter: { _id: user._id }, update: { $set: { visitorEmails } } } });
			});

			if (updates.length) {
				// eslint-disable-next-line no-await-in-loop
				await LivechatVisitors.col.bulkWrite(updates);
			}

			incrementSkip(limit);
		}

		Users.tryDropIndex({ 'visitorEmails.address': 1 });
	},
});
