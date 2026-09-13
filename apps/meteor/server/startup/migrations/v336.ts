import { addMigration } from '../../lib/migrations';

addMigration({
	version: 336,
	name: 'Fix null visitorEmails and phone in livechat_visitor',
	async up() {
		const col = this.db.collection('livechat_visitor');

		await col.updateMany(
			{
				$or: [
					{ visitorEmails: null },
					{ visitorEmails: { $exists: false } }
				]
			},
			{ $set: { visitorEmails: [] } }
		);

		await col.updateMany(
			{
				$or: [
					{ phone: null },
					{ phone: { $exists: false } }
				]
			},
			{ $set: { phone: [] } }
		);
	},
});
