import { Users, Subscriptions } from '../../../app/models/server/raw';
import { Migrations } from '../../../app/migrations/server';

Migrations.add({
	version: 199,
	up: () => {
		Promise.await((async () => {
			const usersCursor = Users.find({}, { fields: { _id: 1 } });
			const total = await usersCursor.count();
			let i = 0;

			console.log('Migrating ', total, 'records...');

			for await (const user of usersCursor) {
				const rooms = await Subscriptions.find({
					'u._id': user._id,
					t: { $nin: ['d', 'l'] },
				}, { rid: 1 }).toArray();

				await Users.update({
					_id: user._id,
				}, {
					$set: {
						__rooms: rooms.map(({ rid }) => rid),
					},
				});

				i++;
				if (i % 100 === 0 || i === total) {
					console.log(i, 'of', total, 'records migrated');
				}
			}
		})());
	},
});
