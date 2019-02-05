import { Meteor } from 'meteor/meteor';
import Future from 'fibers/future';

RocketChat.Migrations.add({
	version: 130,
	up() {
		RocketChat.models.Rooms._db.originals.update(
			{
				t: { $ne: 'd' },
			},
			{
				$unset: { usernames: 1 },
			},
			{
				multi: true,
			}
		);

		RocketChat.models.Rooms.find(
			{
				usersCount: { $exists: false },
			},
			{
				fields: {
					_id: 1,
				},
			}
		).forEach(({ _id }) => {
			const usersCount = RocketChat.models.Subscriptions.findByRoomId(
				_id
			).count();

			RocketChat.models.Rooms._db.originals.update(
				{
					_id,
				},
				{
					$set: {
						usersCount,
					},
				}
			);
		});

		// Getting all subscriptions and users to memory allow us to process in batches,
		// all other solutions takes hundreds or thousands times more to process.
		const subscriptions = RocketChat.models.Subscriptions.find(
			{
				t: 'd',
				name: { $exists: true },
				fname: { $exists: false },
			},
			{
				fields: {
					name: 1,
				},
			}
		).fetch();

		const users = RocketChat.models.Users.find(
			{ username: { $exists: true }, name: { $exists: true } },
			{ fields: { username: 1, name: 1 } }
		).fetch();
		const usersByUsername = users.reduce((obj, user) => {
			obj[user.username] = user.name;
			return obj;
		}, {});

		const updateSubscription = (subscription) => new Promise((resolve) => {
			Meteor.defer(() => {
				const name = usersByUsername[subscription.name];

				if (!name) {
					return resolve();
				}

				RocketChat.models.Subscriptions._db.originals.update(
					{
						_id: subscription._id,
					},
					{
						$set: {
							fname: name,
						},
					}
				);

				resolve();
			});
		});

		// Use FUTURE to process itens in batchs and wait the final one
		const fut = new Future();

		const processBatch = () => {
			const itens = subscriptions.splice(0, 1000);

			console.log(
				'Migrating',
				itens.length,
				'of',
				subscriptions.length,
				'subscriptions'
			);

			if (itens.length) {
				Promise.all(itens.map((s) => updateSubscription(s))).then(() => {
					processBatch();
				});
			} else {
				fut.return();
			}
		};

		processBatch();

		fut.wait();
	},
});
