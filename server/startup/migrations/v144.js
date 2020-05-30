import { Migrations } from '../../migrations';
import { Sessions } from '../../../app/models/server';

Migrations.add({
	version: 144,
	up() {
		console.log('Restoring sessions data');
		Promise.await(Sessions.model.rawCollection().removeMany({
			type: 'user_daily',
		}));

		Promise.await(Sessions.model.rawCollection().updateMany({
			type: 'computed-session',
		}, {
			$set: {
				type: 'session',
			},
			$unset: {
				_computedAt: 1,
			},
		}));
		console.log('Restoring sessions data - Done');
	},
});
