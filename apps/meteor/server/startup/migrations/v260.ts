import { ILivechatVisitor } from '@rocket.chat/core-typings';

import { addMigration } from '../../lib/migrations';
import { LivechatVisitors, Users } from '../../../app/models/server';

// Convert all visitor emails to lowercase
addMigration({
	version: 260,
	up() {
		const updates: unknown[] = [];
		LivechatVisitors.find({ 'visitorEmails.address': /[A-Z]/ })
			.forEach((user: ILivechatVisitor) => {
				const visitorEmails = user.visitorEmails?.map((e) => {
					e.address = e.address.toLowerCase();
					return e;
				});
				updates.push({ updateOne: { filter: { _id: user._id }, update: { $set: { visitorEmails } } } });
			})
			// @ts-expect-error - col is not typed looks like
			.then(() => LivechatVisitors.col.bulkWrite(updates))
			.then(() => {
				console.log('Migration 260: Converted all visitor emails to lowercase');
			});

		Users.tryDropIndex({ 'visitorEmails.address': 1 });
	},
});
