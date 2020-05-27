import { Migrations } from '../../migrations';
import { Rooms, Subscriptions } from '../../../app/models';

Migrations.add({
	version: 85,
	up() {
		const query = {
			t: 'p',
			usernames: { $size: 2 },
			u: { $exists: false },
			name: { $exists: false },
		};

		const rooms = Rooms.find(query).fetch();

		if (rooms.length > 0) {
			const rids = rooms.map((room) => room._id);
			Rooms.update({ _id: { $in: rids } }, { $set: { t: 'd' } }, { multi: true });
			Subscriptions.update({ rid: { $in: rids } }, { $set: { t: 'd' } }, { multi: true });
		}
	},
});
