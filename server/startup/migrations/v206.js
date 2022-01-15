import { addMigration } from '../../lib/migrations';
import { Subscriptions, Messages } from '../../../app/models/server/raw';

async function migrate() {
	const subs = await Subscriptions.find(
		{
			$or: [
				{
					'tunread.0': { $exists: true },
				},
				{
					'tunreadUser.0': { $exists: true },
				},
				{
					'tunreadGroup.0': { $exists: true },
				},
			],
		},
		{
			projection: {
				_id: 0,
				tunread: 1,
				tunreadUser: 1,
				tunreadGroup: 1,
			},
		},
	).toArray();

	// Get unique thread ids
	const tunreads = new Set();
	for (const { tunread = [], tunreadUser = [], tunreadGroup = [] } of subs) {
		tunread.forEach((i) => tunreads.add(i));
		tunreadUser.forEach((i) => tunreads.add(i));
		tunreadGroup.forEach((i) => tunreads.add(i));
	}

	const inexistentThreads = new Set();
	for await (const tunread of tunreads) {
		if (!(await Messages.findOne({ _id: tunread }, { _id: 1 }))) {
			inexistentThreads.add(tunread);
		}
	}

	const inexistentThreadsArr = [...inexistentThreads];

	await Subscriptions.update(
		{
			$or: [
				{
					tunread: { $in: inexistentThreadsArr },
				},
				{
					tunreadUser: { $in: inexistentThreadsArr },
				},
				{
					tunreadGroup: { $in: inexistentThreadsArr },
				},
			],
		},
		{
			$pullAll: {
				tunread: inexistentThreadsArr,
				tunreadUser: inexistentThreadsArr,
				tunreadGroup: inexistentThreadsArr,
			},
		},
	);
}

addMigration({
	version: 206,
	up() {
		Promise.await(migrate());
	},
});
