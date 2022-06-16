import { ILivechatVisitor } from '@rocket.chat/core-typings';
import { BulkWriteOperation, Cursor } from 'mongodb';

import { addMigration } from '../../lib/migrations';
import { LivechatVisitors, Users } from '../../../app/models/server';
import { LivechatVisitors as VisitorsRaw } from '../../../app/models/server/raw';

const getNextPageCursor = (skip: number, limit: number): Cursor<ILivechatVisitor> => {
	return LivechatVisitors.find({ 'visitorEmails.address': /[A-Z]/ }, { skip, limit, sort: { _id: 1 } });
};

// Convert all visitor emails to lowercase
addMigration({
	version: 260,
	up() {
		const updates: BulkWriteOperation<ILivechatVisitor>[] = [];
		const count = LivechatVisitors.find({ 'visitorEmails.address': /[A-Z]/ }).count();
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
				Promise.await(VisitorsRaw.col.bulkWrite(updates));
			}

			incrementSkip(limit);
		}

		Users.tryDropIndex({ 'visitorEmails.address': 1 });
	},
});
