import Future from 'fibers/future';

import { Migrations } from '../../../app/migrations';
import { Rooms } from '../../../app/models/server/raw';
import { Team } from '../../sdk';

async function migrateTeamNames(fut) {
	const rooms = await Rooms.find({ teamMain: true }, { projection: { name: 1, fname: 1, teamId: 1 } }).toArray();
	await Promise.all(rooms.map(async ({ name, fname, teamId }) => Team.updateTeamName(teamId, fname || name)));
	fut.return();
}

Migrations.add({
	version: 221,
	up() {
		const fut = new Future();
		migrateTeamNames(fut);
		fut.wait();
	},
});
