import { Migrations } from '../../../app/migrations';
import { Subscriptions, Rooms } from '../../../app/models/server/raw';

const batchSize = 2;

const updateSubscriptions = async () => new Promise(async (resolve, reject) => {
	Subscriptions
		.find({ t: 'd' }, { projection: { rid: 1, u: 1 } })
		.limit(batchSize)
		.forEach(async (sub) => {
			console.log('sub', sub);
			const room = await Rooms.findOne({ _id: sub.rid }, { projection: { usernames: 1 } });
			if (!room) {
				console.log(`ROOM NOT FOUND: ${ sub.rid }`);
				return;
			}

			if (!room.usernames || room.usernames.length === 0) {
				console.log(`NO USERNAMES: ${ sub.rid }`);
				return;
			}

			const name = room.usernames
				.filter((u) => u !== sub.u.username)
				.sort()
				.join(', ') || sub.u.username;
			if (!name) {
				console.log(`NO NAME ${ sub._id }`);
				return;
			}

			console.log('fix', sub._id);
			await Subscriptions.update({ _id: sub._id }, { $set: { name, _updatedAt: new Date() } });
		}, (error) => {
			if (error) {
				return reject(error);
			}
			resolve();
		});
});

Migrations.add({
	version: 213,
	up() {
		console.log('starting fix');
		Promise.await((async () => {
			const options = {
				projection: { rid: 1, u: 1, name: 1 },
			};
			const cursor = Subscriptions.find({ t: 'd' }, options).limit(100);
			const total = await cursor.count();

			console.log('total ->', total);

			// if number of subscription is low, we can go ahead and fix them all
			if (total < 5) { // 1000) {
				return updateSubscriptions();
			}

			// otherwise we'll first see if they're broken
			const subs = await cursor.toArray();
			const subsTotal = subs.length;
			console.log('subsTotal ->', subsTotal);

			const subsWithRoom = await Promise.all(subs.map(async (sub) => ({
				sub,
				room: await Rooms.findOne({ _id: sub.rid }, { projection: { usernames: 1 } }),
			})));

			const wrongSubs = subsWithRoom
				.filter(({ room }) => room && room.usernames && room.usernames.length > 0)
				.filter(({ room, sub }) => {
					const name = room.usernames
						.filter((u) => u !== sub.u.username)
						.sort()
						.join(', ') || sub.u.username;

					return name !== sub.name;
				}).length;


			console.log('wrongSubs ->', wrongSubs);

			// if less then 10% of subscriptions are wrong, we're fine, doesn't need to do anything
			if (wrongSubs / subsTotal < 0.1) {
				return;
			}

			return updateSubscriptions();
		})());
		console.log('fix done');
	},
});
