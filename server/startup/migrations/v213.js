import { addMigration } from '../../lib/migrations';
import { Subscriptions, Rooms } from '../../../app/models/server/raw';

const updateSubscriptions = async () => {
	const cursor = Subscriptions.find({ t: 'd' }, { projection: { rid: 1, u: 1 } });

	let actions = [];
	for await (const sub of cursor) {
		const room = await Rooms.findOne({ _id: sub.rid }, { projection: { usernames: 1 } });
		if (!room) {
			console.log(`[migration] room record not found: ${sub.rid}`);
			continue;
		}

		if (!room.usernames || room.usernames.length === 0) {
			console.log(`[migration] room without usernames: ${sub.rid}`);
			continue;
		}

		const name =
			room.usernames
				.filter((u) => u !== sub.u.username)
				.sort()
				.join(', ') || sub.u.username;
		if (!name) {
			console.log(`[migration] subscription without name ${sub._id}`);
			continue;
		}

		actions.push({
			updateMany: {
				filter: { _id: sub._id },
				update: { $set: { name, _updatedAt: new Date() } },
			},
		});
		if (actions.length === 1000) {
			await Subscriptions.col.bulkWrite(actions, { ordered: false });
			actions = [];
		}
	}
	if (actions.length) {
		await Subscriptions.col.bulkWrite(actions, { ordered: false });
	}
};

addMigration({
	version: 213,
	up() {
		Promise.await(
			(async () => {
				const options = {
					projection: { rid: 1, u: 1, name: 1 },
				};
				const cursor = Subscriptions.find({ t: 'd' }, options).sort({ _updatedAt: 1 }).limit(100);
				const total = await cursor.count();

				// if number of subscription is low, we can go ahead and fix them all
				if (total < 1000) {
					return updateSubscriptions();
				}

				// otherwise we'll first see if they're broken
				const subs = await cursor.toArray();
				const subsTotal = subs.length;

				const subsWithRoom = await Promise.all(
					subs.map(async (sub) => ({
						sub,
						room: await Rooms.findOne({ _id: sub.rid }, { projection: { usernames: 1 } }),
					})),
				);

				const wrongSubs = subsWithRoom
					.filter(({ room }) => room && room.usernames && room.usernames.length > 0)
					.filter(({ room, sub }) => {
						const name =
							room.usernames
								.filter((u) => u !== sub.u.username)
								.sort()
								.join(', ') || sub.u.username;

						return name !== sub.name;
					}).length;

				// if less then 5% of subscriptions are wrong, we're fine, doesn't need to do anything
				if (wrongSubs / subsTotal < 0.05) {
					return;
				}

				return updateSubscriptions();
			})(),
		);
	},
});
