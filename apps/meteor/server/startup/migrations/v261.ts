import { addMigration } from '../../lib/migrations';
import { ILivechatVisitor } from '../../../definition/ILivechatVisitor';
import { Users } from '../../../app/models/server';

// Convert all visitor emails to lowercase
addMigration({
	version: 261,
	up() {
		const updates: unknown[] = [];
		Users.find({ 'visitorEmails.address': /[A-Z]/ })
			.limit(6000)
			.forEach((user: ILivechatVisitor) => {
				const visitorEmails = user.visitorEmails?.map((e) => {
					e.address = e.address.toLowerCase();
					return e;
				});
				updates.push({ updateOne: { filter: { _id: user._id }, update: { $set: { visitorEmails } } } });
			})
			// @ts-expect-error - col is not typed looks like
			.then(() => Users.col.bulkWrite(updates))
			.then(() => {
				console.log('Migration 261: Converted all visitor emails to lowercase');
			});
	},
});
