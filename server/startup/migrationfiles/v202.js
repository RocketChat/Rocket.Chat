import { Migrations } from '../migrations';
import Uploads from '../../models/meteor/Uploads';

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
