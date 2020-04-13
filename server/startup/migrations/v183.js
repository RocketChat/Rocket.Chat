import { Random } from 'meteor/random';

import { Migrations } from '../../../app/migrations';
import { Rooms, Messages } from '../../../app/models/server';

Migrations.add({
	version: 183,
	up() {
		Rooms.find({ t: 'd', prid: { $exists: true }, uids: [null] }, { fields: { _id: 1 } }).forEach(({ _id }) => {
			const { u } = Messages.findOne({ drid: _id }, { fields: { u: 1 } }) || {};

			Rooms.update({ _id }, {
				$set: {
					t: 'p',
					name: Random.id(),
					u,
					ro: false,
					default: false,
					sysMes: true,
				},
				$unset: {
					usernames: 1,
					uids: 1,
				},
			});
		});
	},
});
