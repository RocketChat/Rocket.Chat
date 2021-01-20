import { Migrations } from '../../../app/migrations/server';
import Uploads from '../../../app/models/server/models/Uploads';

Migrations.add({
	version: 202,
	up() {
		Promise.await(Uploads.model.rawCollection().updateMany({
			type: 'audio/mp3',
		}, {
			$set: {
				type: 'audio/mpeg',
			},
		}));
	},
});
