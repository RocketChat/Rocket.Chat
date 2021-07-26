import { Migrations } from '../../../app/migrations/server';
import { LivechatRooms, Users } from '../../../app/models/server';

function migrateAgentInformation() {
	const rooms = LivechatRooms.findAll({
		// open: true, // should we update only open rooms?
		servedBy: { $exists: true },
	}, { fields: {
		'servedBy._id': 1,
		_id: 1,
	} });

	const operations = [];
	const agents = Users.findAgents({ fields: { name: 1, emails: 1, _id: 1 } }).fetch();

	for (const room of rooms) {
		const agentId = room.servedBy._id;
		const agent = agents.find((a) => a._id === agentId);

		operations.push({
			updateOne: {
				filter: { _id: room._id },
				update: {
					$set: {
						'servedBy.name': agent.name,
						'servedBy.emails': agent.emails,
					},
				},
			},
		});
	}

	if (operations.length) {
		Promise.await(LivechatRooms.model.rawCollection().bulkWrite(operations, { ordered: false }));
	}
}

Migrations.add({
	version: 228,
	up() {
		migrateAgentInformation();
	},
});
