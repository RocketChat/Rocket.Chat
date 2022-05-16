import { MongoInternals } from 'meteor/mongo';
import Future from 'fibers/future';
import { TEAM_TYPE } from '@rocket.chat/core-typings';

import { addMigration } from '../../lib/migrations';
import { Rooms } from '../../../app/models/server/raw';
import { TeamRaw } from '../../../app/models/server/raw/Team';

async function migrateTeamNames(fut) {
	const { mongo } = MongoInternals.defaultRemoteCollectionDriver();
	const Team = new TeamRaw(mongo.db.collection('rocketchat_team'));

	const rooms = await Rooms.find({ teamMain: true }, { projection: { name: 1, fname: 1, teamId: 1, t: 1 } }).toArray();
	await Promise.all(
		rooms.map(async ({ name, fname, t, teamId }) => {
			const update = {
				name: fname || name,
				type: t === 'c' ? TEAM_TYPE.PUBLIC : TEAM_TYPE.PRIVATE,
			};
			Team.updateNameAndType(teamId, update);
		}),
	);
	fut.return();
}

addMigration({
	version: 221,
	up() {
		const fut = new Future();
		migrateTeamNames(fut);
		fut.wait();
	},
});
