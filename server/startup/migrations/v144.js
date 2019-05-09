import { Migrations } from '../../../app/migrations/server';
import { Sessions } from '../../../app/models/server';

Migrations.add({
	version: 144,
	up() {
		Sessions.remove({
			type: 'user_daily',
		});

		Sessions.update({
			type: 'computed-session',
		}, {
			$set: {
				type: 'session',
			},
			$unset: {
				_computedAt: 1,
			},
		}, { multi: true });
	},
});
