import { Migrations } from '../../../app/migrations/server';
import { Messages, Rooms } from '../../../app/models/server';

Migrations.add({
	version: 140,
	up() {
		Messages.find({ drid: { $exists: 1 } }, { fields: { drid: 1 } }).forEach(({ _id, drid }) => Rooms.findOne({ _id: drid }) || Messages.update({ _id }, {
			$unset: {
				drid: 1,
				dcount: 1,
				dlm: 1,
				t: 1,
			},
		}));
	},
});
